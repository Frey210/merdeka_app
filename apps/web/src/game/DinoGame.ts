import type PhaserType from "phaser";

export interface DinoGameResult {
  durationMs: number;
  score: number;
  jumpTimesMs: number[];
}

interface DinoGameOptions {
  parent: HTMLElement;
  seed: number;
  onReady?: () => void;
  onGameOver: (result: DinoGameResult) => void;
}

type GamePhase = "waiting" | "countdown" | "running" | "ended";

export const START_COUNTDOWN_STEP_MS = 700;
const START_COUNTDOWN_CUES = ["BERSEDIA", "SIAP", "MULAI!"] as const;

const DINO_RUN_SHEET = "/game-assets/dino-merdeka/atlases/dino-run.png";
const DINO_JUMP_SHEET = "/game-assets/dino-merdeka/atlases/dino-jump.png";
const DINO_STATES_SHEET = "/game-assets/dino-merdeka/atlases/dino-states.png";
const PLANE_FLY_SHEET = "/game-assets/dino-merdeka/atlases/plane-fly.png";

const DINO_FRAME = { width: 320, height: 256 } as const;
const PLANE_FRAME = { width: 448, height: 224 } as const;

export function getStartCountdownCue(elapsedMs: number): string | null {
  const cueIndex = Math.floor(Math.max(0, elapsedMs) / START_COUNTDOWN_STEP_MS);
  return START_COUNTDOWN_CUES[cueIndex] ?? null;
}

export function advanceGameDurationMs(currentDurationMs: number, deltaMs: number): number {
  return Math.min(120_000, Math.max(0, currentDurationMs + Math.max(0, deltaMs)));
}

export type ObstacleTexture = "obstacle-cone" | "obstacle-suitcase" | "obstacle-plane";

export function selectObstacleTexture(durationMs: number, roll: number): ObstacleTexture {
  if (durationMs >= 6_000 && roll < 0.24) return "obstacle-plane";
  return roll > 0.58 ? "obstacle-cone" : "obstacle-suitcase";
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export async function mountDinoGame({ parent, seed, onReady, onGameOver }: DinoGameOptions): Promise<() => void> {
  const { default: Phaser } = await import("phaser");
  const random = createSeededRandom(seed);

  let dino: PhaserType.Physics.Arcade.Sprite;
  let obstacles: PhaserType.Physics.Arcade.Group;
  let scoreText: PhaserType.GameObjects.Text;
  let gameOverText: PhaserType.GameObjects.Text;
  let readyText: PhaserType.GameObjects.Text;
  let countdownText: PhaserType.GameObjects.Text;
  let countdownStepText: PhaserType.GameObjects.Text;
  let startOverlay: PhaserType.GameObjects.Rectangle;
  let instructionText: PhaserType.GameObjects.Text;
  let cloudLayer: PhaserType.GameObjects.TileSprite;
  let skylineLayer: PhaserType.GameObjects.TileSprite;
  let runwayLayer: PhaserType.GameObjects.TileSprite;
  let phase: GamePhase = "waiting";
  let countdownElapsedMs = 0;
  let startRunning = () => undefined;
  let elapsedMs = 0;
  let nextObstacleAt = 0;
  let currentSpeed = 480;
  const jumpTimesMs: number[] = [];

  function createTextures(scene: PhaserType.Scene) {
    const cone = scene.make.graphics({ x: 0, y: 0 });
    cone.fillStyle(0xed1c24);
    cone.fillTriangle(8, 68, 30, 8, 52, 68);
    cone.fillStyle(0xffffff);
    cone.fillRect(18, 38, 25, 9);
    cone.fillStyle(0x101010);
    cone.fillRect(3, 68, 54, 10);
    cone.generateTexture("obstacle-cone", 60, 80);
    cone.destroy();

    const suitcase = scene.make.graphics({ x: 0, y: 0 });
    suitcase.lineStyle(6, 0x101010);
    suitcase.strokeRoundedRect(26, 3, 42, 23, 8);
    suitcase.fillStyle(0xed1c24);
    suitcase.fillRoundedRect(4, 20, 86, 64, 12);
    suitcase.fillStyle(0xffffff);
    suitcase.fillRect(42, 20, 10, 64);
    suitcase.fillStyle(0x101010);
    suitcase.fillCircle(22, 88, 6);
    suitcase.fillCircle(73, 88, 6);
    suitcase.generateTexture("obstacle-suitcase", 94, 96);
    suitcase.destroy();

    const clouds = scene.make.graphics({ x: 0, y: 0 });
    clouds.fillStyle(0xffffff, 0.95);
    clouds.fillCircle(78, 80, 30);
    clouds.fillCircle(112, 67, 42);
    clouds.fillCircle(155, 83, 28);
    clouds.fillRoundedRect(54, 80, 126, 34, 17);
    clouds.fillCircle(390, 48, 22);
    clouds.fillCircle(418, 38, 31);
    clouds.fillCircle(452, 52, 24);
    clouds.fillRoundedRect(370, 49, 105, 27, 14);
    clouds.generateTexture("parallax-clouds", 512, 128);
    clouds.destroy();

    const skyline = scene.make.graphics({ x: 0, y: 0 });
    skyline.fillStyle(0x101010, 0.12);
    skyline.fillRect(0, 88, 640, 32);
    skyline.fillRect(24, 55, 170, 35);
    skyline.fillTriangle(24, 55, 109, 22, 194, 55);
    skyline.fillRect(210, 66, 170, 24);
    skyline.fillRect(395, 48, 105, 42);
    skyline.fillRect(440, 15, 14, 37);
    skyline.fillRect(425, 9, 44, 13);
    skyline.fillTriangle(425, 9, 447, 0, 469, 9);
    skyline.fillStyle(0xed1c24, 0.16);
    for (let x = 224; x <= 364; x += 28) skyline.fillRect(x, 72, 15, 8);
    skyline.generateTexture("parallax-airport", 512, 128);
    skyline.destroy();

    const runway = scene.make.graphics({ x: 0, y: 0 });
    runway.fillStyle(0x101010);
    runway.fillRect(0, 0, 320, 34);
    runway.fillStyle(0xffffff, 0.9);
    runway.fillRoundedRect(18, 13, 78, 8, 4);
    runway.fillRoundedRect(178, 13, 78, 8, 4);
    runway.fillRoundedRect(338, 13, 78, 8, 4);
    runway.generateTexture("moving-runway", 512, 64);
    runway.destroy();
  }

  const scene: PhaserType.Types.Scenes.SettingsConfig = {
    key: "DinoMerdeka",
  };

  class DinoMerdekaScene extends Phaser.Scene {
    constructor() {
      super(scene);
    }

    preload() {
      this.load.spritesheet("dino-merdeka-run", DINO_RUN_SHEET, {
        frameWidth: DINO_FRAME.width,
        frameHeight: DINO_FRAME.height,
      });
      this.load.spritesheet("dino-merdeka-jump", DINO_JUMP_SHEET, {
        frameWidth: DINO_FRAME.width,
        frameHeight: DINO_FRAME.height,
      });
      this.load.spritesheet("dino-merdeka-states", DINO_STATES_SHEET, {
        frameWidth: DINO_FRAME.width,
        frameHeight: DINO_FRAME.height,
      });
      this.load.spritesheet("obstacle-plane", PLANE_FLY_SHEET, {
        frameWidth: PLANE_FRAME.width,
        frameHeight: PLANE_FRAME.height,
      });
    }

    create() {
      createTextures(this);
      ["dino-merdeka-run", "dino-merdeka-jump", "dino-merdeka-states", "obstacle-plane"].forEach(
        (texture) => this.textures.get(texture).setFilter(Phaser.Textures.FilterMode.NEAREST),
      );
      this.cameras.main.setBackgroundColor("#f7f4ef");

      this.add.circle(1160, 80, 210, 0xed1c24, 0.08);
      this.add.circle(1160, 80, 125).setStrokeStyle(30, 0xed1c24, 0.1);
      this.add.circle(80, 690, 230).setStrokeStyle(45, 0x101010, 0.06);
      cloudLayer = this.add.tileSprite(640, 205, 1280, 150, "parallax-clouds").setAlpha(0.78);
      skylineLayer = this.add.tileSprite(640, 555, 1280, 120, "parallax-airport");
      this.add.text(60, 45, "DINO MERDEKA", {
        color: "#ed1c24",
        fontFamily: "Saira Semi Condensed",
        fontSize: "34px",
        fontStyle: "bold",
        letterSpacing: 5,
      });
      this.add.text(60, 92, "Lari untuk Indonesia", {
        color: "#101010",
        fontFamily: "Saira Semi Condensed",
        fontSize: "26px",
      });

      const ground = this.add.rectangle(640, 630, 1280, 34, 0x101010, 0);
      this.physics.add.existing(ground, true);
      runwayLayer = this.add.tileSprite(640, 630, 1280, 34, "moving-runway");
      this.add.rectangle(640, 651, 1280, 8, 0xed1c24);

      dino = this.physics.add.sprite(175, 614, "dino-merdeka-states", 0);
      dino.setOrigin(0.5, 1);
      dino.setDisplaySize(128, 102);
      dino.setCollideWorldBounds(true);
      (dino.body as PhaserType.Physics.Arcade.Body).setSize(175, 190).setOffset(72, 54);
      this.physics.add.collider(dino, ground);
      this.anims.create({
        key: "dino-running",
        frames: this.anims.generateFrameNumbers("dino-merdeka-run", { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
      this.anims.create({
        key: "dino-jumping",
        frames: this.anims.generateFrameNumbers("dino-merdeka-jump", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: "plane-flying",
        frames: this.anims.generateFrameNumbers("obstacle-plane", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });

      obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
      this.physics.add.collider(dino, obstacles, () => this.finishGame());

      scoreText = this.add
        .text(1220, 50, "0000", {
          color: "#101010",
          fontFamily: "Saira Semi Condensed",
          fontSize: "52px",
          fontStyle: "bold",
        })
        .setOrigin(1, 0);
      instructionText = this.add
        .text(640, 686, "SENTUH LAYAR UNTUK MEMULAI", {
          color: "#101010",
          fontFamily: "Saira Semi Condensed",
          fontSize: "24px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      startOverlay = this.add.rectangle(640, 360, 1280, 720, 0x101010, 0.26).setDepth(28);

      readyText = this.add
        .text(640, 300, "LINTASAN SIAP\nSENTUH LAYAR UNTUK BERSIAP", {
          align: "center",
          color: "#ffffff",
          fontFamily: "Saira Semi Condensed",
          fontSize: "46px",
          fontStyle: "bold",
          letterSpacing: 3,
          lineSpacing: 12,
          stroke: "#101010",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(30);

      countdownText = this.add
        .text(640, 300, "", {
          align: "center",
          color: "#ffffff",
          fontFamily: "Saira Semi Condensed",
          fontSize: "92px",
          fontStyle: "bold",
          letterSpacing: 8,
          stroke: "#101010",
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(31)
        .setVisible(false);

      countdownStepText = this.add
        .text(640, 395, "01 / 03", {
          color: "#ed1c24",
          fontFamily: "Saira Semi Condensed",
          fontSize: "28px",
          fontStyle: "bold",
          letterSpacing: 7,
        })
        .setOrigin(0.5)
        .setDepth(31)
        .setVisible(false);

      gameOverText = this.add
        .text(640, 300, "", {
          align: "center",
          backgroundColor: "#ffffff",
          color: "#101010",
          fontFamily: "Saira Semi Condensed",
          fontSize: "48px",
          fontStyle: "bold",
          padding: { x: 42, y: 28 },
        })
        .setOrigin(0.5)
        .setDepth(20)
        .setVisible(false);

      startRunning = () => {
        phase = "running";
        elapsedMs = 0;
        nextObstacleAt = 1_400;
        startOverlay.setVisible(false);
        countdownText.setVisible(false);
        countdownStepText.setVisible(false);
        instructionText.setText("SENTUH LAYAR UNTUK MELOMPAT");
        dino.clearTint();
        dino.play("dino-running");
      };

      const handleAction = () => {
        if (phase === "waiting") {
          phase = "countdown";
          countdownElapsedMs = 0;
          readyText.setVisible(false);
          startOverlay.setAlpha(0.62);
          countdownText.setText(START_COUNTDOWN_CUES[0]).setVisible(true);
          countdownStepText.setText("01 / 03").setVisible(true);
          instructionText.setText("PERMAINAN AKAN DIMULAI");
          dino.stop();
          dino.setTexture("dino-merdeka-states", 1);
          return;
        }
        if (phase !== "running") return;
        const body = dino.body as PhaserType.Physics.Arcade.Body;
        if (body.blocked.down || body.touching.down) {
          dino.setVelocityY(-720);
          dino.play("dino-jumping", true);
          jumpTimesMs.push(Math.round(elapsedMs));
          this.tweens.add({ targets: dino, angle: -7, duration: 130, yoyo: true });
        }
      };
      this.input.on("pointerdown", handleAction);
      this.input.keyboard?.on("keydown-SPACE", handleAction);
      this.input.keyboard?.on("keydown-UP", handleAction);

      phase = "waiting";
      countdownElapsedMs = 0;
      elapsedMs = 0;
      nextObstacleAt = 1_400;
      onReady?.();
    }

    spawnObstacle() {
      const roll = random();
      const texture = selectObstacleTexture(elapsedMs, roll);
      const y = texture === "obstacle-plane" ? 505 : texture === "obstacle-cone" ? 574 : 566;
      const obstacle = obstacles.create(1380, y, texture) as PhaserType.Physics.Arcade.Sprite;
      const speedFactor = texture === "obstacle-plane" ? 1.12 : 1;
      obstacle.setData("speedFactor", speedFactor);
      obstacle.setVelocityX(-currentSpeed * speedFactor);
      const body = obstacle.body as PhaserType.Physics.Arcade.Body;
      if (texture === "obstacle-plane") {
        obstacle.setDisplaySize(190, 95);
        obstacle.setFlipX(true);
        obstacle.play("plane-flying");
        body.setSize(363, 127).setOffset(42, 47);
      } else {
        body.setSize(
          texture === "obstacle-cone" ? 42 : 76,
          texture === "obstacle-cone" ? 65 : 78,
        );
      }
    }

    finishGame() {
      if (phase !== "running") return;
      phase = "ended";
      const durationMs = Math.round(elapsedMs);
      const score = Math.floor(durationMs / 100);
      dino.stop();
      dino.clearTint();
      dino.setTexture("dino-merdeka-states", 3);
      dino.setDisplaySize(128, 102);
      dino.setVelocity(0, 0);
      obstacles.getChildren().forEach((child) => (child as PhaserType.Physics.Arcade.Sprite).setVelocityX(0));
      gameOverText.setText(`PERJALANAN SELESAI\nSKOR ${score.toString().padStart(4, "0")}`).setVisible(true);
      this.time.delayedCall(650, () => onGameOver({ durationMs, score, jumpTimesMs: [...jumpTimesMs] }));
    }

    update(_time: number, delta: number) {
      if (phase === "countdown") {
        countdownElapsedMs += Math.max(0, delta);
        const cue = getStartCountdownCue(countdownElapsedMs);
        if (cue) {
          if (countdownText.text !== cue) {
            countdownText.setText(cue);
            const step = Math.floor(countdownElapsedMs / START_COUNTDOWN_STEP_MS) + 1;
            countdownStepText.setText(`${String(step).padStart(2, "0")} / 03`);
          }
        } else {
          startRunning();
        }
        return;
      }
      if (phase !== "running") return;
      elapsedMs = advanceGameDurationMs(elapsedMs, delta);
      const durationMs = elapsedMs;
      const dinoBody = dino.body as PhaserType.Physics.Arcade.Body;
      if ((dinoBody.blocked.down || dinoBody.touching.down) && dino.anims.currentAnim?.key !== "dino-running") {
        dino.setAngle(0);
        dino.play("dino-running", true);
      }
      currentSpeed = Math.min(860, 480 + durationMs / 160);
      scoreText.setText(Math.floor(durationMs / 100).toString().padStart(4, "0"));
      const seconds = Math.max(0, delta) / 1_000;
      cloudLayer.tilePositionX += currentSpeed * 0.035 * seconds;
      skylineLayer.tilePositionX += currentSpeed * 0.12 * seconds;
      runwayLayer.tilePositionX += currentSpeed * seconds;

      if (durationMs >= nextObstacleAt) {
        this.spawnObstacle();
        const difficulty = Math.min(450, durationMs / 80);
        nextObstacleAt = durationMs + 1_350 + random() * 650 - difficulty;
      }
      obstacles.getChildren().forEach((child) => {
        const obstacle = child as PhaserType.Physics.Arcade.Sprite;
        obstacle.setVelocityX(-currentSpeed * (obstacle.getData("speedFactor") as number || 1));
        if (obstacle.x < -220) obstacle.destroy();
      });

      if (durationMs >= 120_000) this.finishGame();
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: "#f7f4ef",
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 1_650 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: DinoMerdekaScene,
    input: { activePointers: 2 },
    render: { antialias: true, pixelArt: false, roundPixels: true },
  });

  return () => game.destroy(true);
}
