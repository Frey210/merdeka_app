import { type FormEvent, useState } from "react";
import { KioskKeyboard } from "../components/KioskKeyboard";
import { submitGuestEntry } from "../lib/api";

interface GuestBookScreenProps {
  onBack: () => void;
}

interface FormState {
  displayName: string;
  origin: string;
  message: string;
  consentPublic: boolean;
}

const initialForm: FormState = {
  displayName: "",
  origin: "",
  message: "",
  consentPublic: false,
};

type TextFieldName = "displayName" | "origin" | "message";

const fieldSettings: Record<TextFieldName, { label: string; maxLength: number; multiline?: boolean }> = {
  displayName: { label: "Nama", maxLength: 50 },
  origin: { label: "Asal daerah", maxLength: 60 },
  message: { label: "Harapan untuk Indonesia", maxLength: 240, multiline: true },
};

export function GuestBookScreen({ onBack }: GuestBookScreenProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<TextFieldName | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitGuestEntry({
        display_name: form.displayName,
        origin: form.origin,
        message: form.message,
        consent_public: form.consentPublic,
      });
      setSubmittedName(form.displayName.trim());
      setForm(initialForm);
      setActiveField(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Harapan belum dapat disimpan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedName) {
    return (
      <section className="grid flex-1 place-items-center py-8 text-center">
        <div className="max-w-4xl rounded-[3rem] bg-white p-14 shadow-2xl">
          <span className="mx-auto grid size-24 place-items-center rounded-full bg-brand-red text-5xl font-bold text-white" aria-hidden="true">
            ✓
          </span>
          <p className="mt-8 text-2xl font-bold uppercase tracking-[0.16em] text-brand-red">Harapan diterima</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight lg:text-7xl">Terima kasih, {submittedName}.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-2xl leading-relaxed text-ink/65">
            Harapanmu tersimpan dan akan tampil setelah ditinjau petugas.
          </p>
          <button className="touch-button-primary mt-10" type="button" onClick={onBack}>
            Kembali ke Menu
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col py-5 lg:py-8">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p className="text-xl font-bold uppercase tracking-[0.18em] text-brand-red">Tulis Harapan</p>
          <h1 className="mt-2 text-5xl font-bold leading-none lg:text-7xl">Untuk Indonesia</h1>
        </div>
        <button className="touch-button-secondary" type="button" onClick={onBack}>
          ← Kembali
        </button>
      </div>

      <form className="grid flex-1 gap-6 rounded-[3rem] bg-white p-8 shadow-2xl lg:grid-cols-2 lg:p-12" onSubmit={submit}>
        <label className="kiosk-field">
          <span>Nama</span>
          <input
            required
            minLength={2}
            maxLength={50}
            autoComplete="off"
            inputMode="none"
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            onFocus={() => setActiveField("displayName")}
            placeholder="Nama panggilan atau nama lengkap"
          />
        </label>

        <label className="kiosk-field">
          <span>Asal daerah</span>
          <input
            required
            minLength={2}
            maxLength={60}
            autoComplete="off"
            inputMode="none"
            value={form.origin}
            onChange={(event) => setForm({ ...form, origin: event.target.value })}
            onFocus={() => setActiveField("origin")}
            placeholder="Contoh: Makassar"
          />
        </label>

        <label className="kiosk-field lg:col-span-2">
          <span>Harapan untuk Indonesia</span>
          <textarea
            required
            minLength={10}
            maxLength={240}
            rows={3}
            inputMode="none"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            onFocus={() => setActiveField("message")}
            placeholder="Tuliskan harapanmu dalam 10–240 karakter"
          />
          <small>{form.message.length} / 240</small>
        </label>

        <label className="flex cursor-pointer items-start gap-5 rounded-[2rem] bg-warm-white p-6 text-xl leading-snug lg:col-span-2">
          <input
            className="mt-1 size-8 shrink-0 accent-brand-red"
            type="checkbox"
            checked={form.consentPublic}
            onChange={(event) => setForm({ ...form, consentPublic: event.target.checked })}
          />
          <span>Saya bersedia nama, asal, dan harapan ini ditampilkan di layar publik setelah moderasi.</span>
        </label>

        {error && (
          <p className="rounded-2xl bg-red-50 p-5 text-xl font-bold text-brand-red lg:col-span-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end lg:col-span-2">
          <button className="touch-button-primary min-w-64 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={submitting}>
            {submitting ? "Menyimpan…" : "Kirim Harapan"}
          </button>
        </div>
      </form>
      {activeField && (
        <KioskKeyboard
          value={form[activeField]}
          onChange={(value) => setForm((current) => ({ ...current, [activeField]: value }))}
          onClose={() => setActiveField(null)}
          {...fieldSettings[activeField]}
        />
      )}
    </section>
  );
}
