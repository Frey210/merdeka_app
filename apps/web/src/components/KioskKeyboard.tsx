import { useEffect, useRef, useState } from "react";
import Keyboard, { type KeyboardReactInterface } from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

interface KioskKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  maxLength: number;
  multiline?: boolean;
  label: string;
}

const keyboardLayout = {
  default: [
    "1 2 3 4 5 6 7 8 9 0 {bksp}",
    "q w e r t y u i o p",
    "a s d f g h j k l {enter}",
    "{shift} z x c v b n m , . {shift}",
    "{space}",
  ],
  shift: [
    "1 2 3 4 5 6 7 8 9 0 {bksp}",
    "Q W E R T Y U I O P",
    "A S D F G H J K L {enter}",
    "{shift} Z X C V B N M , . {shift}",
    "{space}",
  ],
};

export function KioskKeyboard({ value, onChange, onClose, maxLength, multiline = false, label }: KioskKeyboardProps) {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null);
  const [layoutName, setLayoutName] = useState<"default" | "shift">("default");

  useEffect(() => {
    keyboardRef.current?.setInput(value);
  }, [value]);

  const handleKeyPress = (button: string) => {
    if (button === "{shift}" || button === "{lock}") {
      setLayoutName((current) => (current === "default" ? "shift" : "default"));
    }
    if (button === "{enter}" && !multiline) onClose();
  };

  return (
    <div className="kiosk-keyboard-layer" aria-label={`Keyboard layar untuk ${label}`}>
      <button className="kiosk-keyboard-backdrop" type="button" aria-label="Tutup keyboard layar" onClick={onClose} />
      <section className="kiosk-keyboard-panel" aria-label="Keyboard layar sentuh">
        <div className="kiosk-keyboard-heading">
          <div>
            <p>Keyboard layar</p>
            <strong>{label}</strong>
            <span className="kiosk-keyboard-value" aria-live="polite">{value || "Mulai mengetik…"}</span>
          </div>
          <button type="button" onClick={onClose}>Selesai</button>
        </div>
        <Keyboard
          keyboardRef={(instance) => { keyboardRef.current = instance; }}
          layout={keyboardLayout}
          layoutName={layoutName}
          maxLength={maxLength}
          newLineOnEnter={multiline}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          preventMouseDownDefault
          useButtonTag
          theme="hg-theme-default merdeka-keyboard"
          display={{
            "{bksp}": "Hapus",
            "{enter}": multiline ? "Baris baru" : "Selesai",
            "{shift}": layoutName === "shift" ? "huruf kecil" : "Huruf Besar",
            "{space}": "Spasi",
          }}
          buttonTheme={[
            { class: "keyboard-action-key", buttons: "{bksp} {enter} {shift}" },
            { class: "keyboard-space-key", buttons: "{space}" },
          ]}
        />
      </section>
    </div>
  );
}
