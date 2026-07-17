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
    "{shift} z x c v b n m , . {caps}",
    "{symbols} {space}",
  ],
  shift: [
    "1 2 3 4 5 6 7 8 9 0 {bksp}",
    "Q W E R T Y U I O P",
    "A S D F G H J K L {enter}",
    "{shift} Z X C V B N M , . {caps}",
    "{symbols} {space}",
  ],
  caps: [
    "1 2 3 4 5 6 7 8 9 0 {bksp}",
    "Q W E R T Y U I O P",
    "A S D F G H J K L {enter}",
    "{shift} Z X C V B N M , . {caps}",
    "{symbols} {space}",
  ],
  symbols: [
    "! @ # $ % & * ( ) {bksp}",
    "- _ = + / : ;",
    "' \" ? , . {enter}",
    "{abc} {space}",
  ],
};

type KeyboardLayoutName = keyof typeof keyboardLayout;

export function KioskKeyboard({ value, onChange, onClose, maxLength, multiline = false, label }: KioskKeyboardProps) {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null);
  const shiftReturnLayout = useRef<"default" | "caps" | null>(null);
  const [capsLock, setCapsLock] = useState(false);
  const [layoutName, setLayoutName] = useState<KeyboardLayoutName>("default");

  useEffect(() => {
    keyboardRef.current?.setInput(value);
  }, [value]);

  const handleKeyPress = (button: string) => {
    if (button === "{shift}") {
      const returnLayout = capsLock ? "caps" : "default";
      shiftReturnLayout.current = returnLayout;
      setLayoutName(capsLock ? "default" : "shift");
      return;
    }
    if (button === "{caps}") {
      const nextCapsLock = !capsLock;
      setCapsLock(nextCapsLock);
      shiftReturnLayout.current = null;
      setLayoutName(nextCapsLock ? "caps" : "default");
      return;
    }
    if (button === "{symbols}") {
      shiftReturnLayout.current = null;
      setLayoutName("symbols");
      return;
    }
    if (button === "{abc}") {
      setLayoutName(capsLock ? "caps" : "default");
      return;
    }
    if (button === "{enter}" && !multiline) onClose();
    if (!button.startsWith("{") && shiftReturnLayout.current) {
      setLayoutName(shiftReturnLayout.current);
      shiftReturnLayout.current = null;
    }
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
            "{shift}": "Shift",
            "{caps}": capsLock ? "Caps aktif" : "Caps",
            "{symbols}": "!@#",
            "{abc}": "ABC",
            "{space}": "Spasi",
          }}
          buttonTheme={[
            { class: "keyboard-action-key", buttons: "{bksp} {enter} {shift} {caps} {symbols} {abc}" },
            ...(capsLock ? [{ class: "keyboard-active-key", buttons: "{caps}" }] : []),
            { class: "keyboard-space-key", buttons: "{space}" },
          ]}
        />
      </section>
    </div>
  );
}
