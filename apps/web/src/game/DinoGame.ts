import type PhaserType from "phaser";

export interface DinoGameResult {
  durationMs: number;
  score: number;
  jumpTimesMs: number[];
}

interface DinoGameOptions {
  parent: HTMLElement;
  seed: number;
  onGameOver: (result: DinoGameResult) => void;
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

export async function mountDinoGame({ parent, seed, onGameOver }: DinoGameOptions): Promise<() => void> {
  const { default: Phaser } = await import("phaser");
  const random = createSeededRandom(seed);

  let dino: PhaserType.Physics.Arcade.Sprite;
  let obstacles: PhaserType.Physics.Arcade.Group;
  let scoreText: PhaserType.GameObjects.Text;
  let gameOverText: PhaserType.GameObjects.Text;
  let startedAt = 0;
  let nextObstacleAt = 0;
  let ended = false;
  let currentSpeed = 480;
  const jumpTimesMs: number[] = [];

  function createTextures(scene: PhaserType.Scene) {
    const dinoGraphic = scene.make.graphics({ x: 0, y: 0 });
    dinoGraphic.fillStyle(0x101010);
    dinoGraphic.fillRect(28, 34, 46, 42);
    dinoGraphic.fillRect(57, 15, 42, 38);
    dinoGraphic.fillRect(88, 25, 14, 7);
    dinoGraphic.fillRect(14, 48, 25, 17);
    dinoGraphic.fillTriangle(4, 48, 30, 42, 30, 62);
    dinoGraphic.fillRect(34, 72, 12, 22);
    dinoGraphic.fillRect(62, 72, 12, 22);
    dinoGraphic.fillStyle(0xffffff);
    dinoGraphic.fillCircle(84, 27, 4);
    dinoGraphic.fillStyle(0x101010);
    dinoGraphic.fillCircle(85, 27, 2);
    dinoGraphic.fillStyle(0x5d4037);
    dinoGraphic.fillRect(48, 3, 4, 45);
    dinoGraphic.fillStyle(0xed1c24);
    dinoGraphic.fillTriangle(52, 4, 89, 13, 52, 22);
    dinoGraphic.fillStyle(0xffffff);
    dinoGraphic.fillTriangle(52, 13, 89, 13, 52, 22);
    dinoGraphic.generateTexture("dino-merdeka", 108, 98);
    dinoGraphic.destroy();

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
  }

  const scene: PhaserType.Types.Scenes.SettingsConfig = {
    key: "DinoMerdeka",
  };

  class DinoMerdekaScene extends Phaser.Scene {
    constructor() {
      super(scene);
    }

    create() {
      createTextures(this);
      this.cameras.main.setBackgroundColor("#f7f4ef");

      this.add.circle(1160, 80, 210, 0xed1c24, 0.08);
      this.add.circle(1160, 80, 125).setStrokeStyle(30, 0xed1c24, 0.1);
      this.add.circle(80, 690, 230).setStrokeStyle(45, 0x101010, 0.06);
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

      const ground = this.add.rectangle(640, 630, 1280, 34, 0x101010);
      this.physics.add.existing(ground, true);
      this.add.rectangle(640, 651, 1280, 8, 0xed1c24);

      dino = this.physics.add.sprite(175, 566, "dino-merdeka");
      dino.setCollideWorldBounds(true);
      (dino.body as PhaserType.Physics.Arcade.Body).setSize(78, 82).setOffset(15, 12);
      this.physics.add.collider(dino, ground);

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
      this.add
        .text(640, 686, "SENTUH LAYAR UNTUK MELOMPAT", {
          color: "#101010",
          fontFamily: "Saira Semi Condensed",
          fontSize: "24px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

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

      const jump = () => {
        if (ended) return;
        const body = dino.body as PhaserType.Physics.Arcade.Body;
        if (body.blocked.down || body.touching.down) {
          dino.setVelocityY(-720);
          jumpTimesMs.push(Math.max(0, Math.round(this.time.now - startedAt)));
          this.tweens.add({ targets: dino, angle: -7, duration: 130, yoyo: true });
        }
      };
      this.input.on("pointerdown", jump);
      this.input.keyboard?.on("keydown-SPACE", jump);
      this.input.keyboard?.on("keydown-UP", jump);

      startedAt = this.time.now;
      nextObstacleAt = startedAt + 1_400;
    }

    spawnObstacle() {
      const texture = random() > 0.48 ? "obstacle-cone" : "obstacle-suitcase";
      const obstacle = obstacles.create(1340, texture === "obstacle-cone" ? 574 : 566, texture) as PhaserType.Physics.Arcade.Sprite;
      obstacle.setVelocityX(-currentSpeed);
      (obstacle.body as PhaserType.Physics.Arcade.Body).setSize(
        texture === "obstacle-cone" ? 42 : 76,
        texture === "obstacle-cone" ? 65 : 78,
      );
    }

    finishGame() {
      if (ended) return;
      ended = true;
      const durationMs = Math.min(120_000, Math.max(0, Math.round(this.time.now - startedAt)));
      const score = Math.floor(durationMs / 100);
      dino.setTint(0xed1c24);
      dino.setVelocity(0, 0);
      obstacles.getChildren().forEach((child) => (child as PhaserType.Physics.Arcade.Sprite).setVelocityX(0));
      gameOverText.setText(`PERJALANAN SELESAI\nSKOR ${score.toString().padStart(4, "0")}`).setVisible(true);
      this.time.delayedCall(650, () => onGameOver({ durationMs, score, jumpTimesMs: [...jumpTimesMs] }));
    }

    update(time: number) {
      if (ended || !startedAt) return;
      const durationMs = time - startedAt;
      currentSpeed = Math.min(860, 480 + durationMs / 160);
      scoreText.setText(Math.floor(durationMs / 100).toString().padStart(4, "0"));

      if (time >= nextObstacleAt) {
        this.spawnObstacle();
        const difficulty = Math.min(450, durationMs / 80);
        nextObstacleAt = time + 1_350 + random() * 650 - difficulty;
      }
      obstacles.getChildren().forEach((child) => {
        const obstacle = child as PhaserType.Physics.Arcade.Sprite;
        obstacle.setVelocityX(-currentSpeed);
        if (obstacle.x < -100) obstacle.destroy();
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
