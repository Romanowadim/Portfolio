"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

const SERVICE_OPTIONS = [
  { label: "Illustration", price: "≤ 300$", value: 300 },
  { label: "Logo", price: "≤ 500$", value: 500 },
  { label: "Site Design", price: "≤ 1000$", value: 1000 },
  { label: "YouTube Header", price: "≤ 300$", value: 300 },
  { label: "Gamedev", price: "≤ 1000$", value: 1000 },
  { label: "Character Design", price: "≤ 500$", value: 500 },
  { label: "Brand Book", price: "≤ 3000$", value: 3000 },
];

export default function OrderForm() {
  const t = useTranslations("order");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [name, setName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [references, setReferences] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalPrice = selected.reduce((sum, label) => {
    const opt = SERVICE_OPTIONS.find((o) => o.label === label);
    return sum + (opt?.value ?? 0);
  }, 0);

  const filtered = SERVICE_OPTIONS.filter(
    (o) =>
      !selected.includes(o.label) &&
      o.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const addOption = (label: string) => {
    setSelected((prev) => [...prev, label]);
    setSearchValue("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removeOption = (label: string) => {
    setSelected((prev) => prev.filter((s) => s !== label));
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex flex-col gap-10 w-full lg:max-w-[24vw]">
      {/* Name + Project Name */}
      <div className="flex gap-[48px]">
        <div className="flex-1 flex flex-col gap-2">
          <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
            NAME<span className="text-[#c0c0c0]">*</span>
          </h3>
          <p className="text-sm font-medium text-[#c0c0c0]">
            Enter your name
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full h-[30px] border border-[#c0c0c0] px-3 text-sm outline-none focus:border-text transition-colors"
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
            PROJECT NAME
          </h3>
          <p className="text-sm font-medium text-[#c0c0c0]">
            Enter the project name (Optional)
          </p>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 w-full h-[30px] border border-[#c0c0c0] px-3 text-sm outline-none focus:border-text transition-colors"
          />
        </div>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
          {t("theme")}<span className="text-[#c0c0c0]">*</span>
        </h3>
        <p className="text-sm font-medium text-[#c0c0c0]">
          {t("themeHint")}
        </p>
        <div className="relative mt-1" ref={wrapperRef}>
          {/* Selected tags */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-[6px] mb-[8px]">
              {selected.map((label) => {
                const option = SERVICE_OPTIONS.find((o) => o.label === label);
                return (
                  <span
                    key={label}
                    className="inline-flex items-center gap-[6px] h-[26px] px-[10px] border border-[#c0c0c0] text-[13px] font-medium text-[#7f7f7f]"
                  >
                    {label}
                    {option && (
                      <span className="text-[#8d9b76]">{option.price}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeOption(label)}
                      className="ml-[2px] text-[#c0c0c0] hover:text-text-secondary transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c0c0c0]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => { setSearchValue(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              className="w-full h-[30px] border border-[#c0c0c0] pl-9 pr-3 text-sm outline-none focus:border-text transition-colors"
            />

            {/* Dropdown */}
            {dropdownOpen && filtered.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white shadow-[0px_1px_10px_0px_rgba(0,0,0,0.1)] rounded-b-[8px] z-10 overflow-hidden">
                {filtered.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => addOption(option.label)}
                    className="w-full flex items-center gap-[12px] px-[20px] py-[8px] hover:bg-[#f5f5f5] transition-colors group"
                  >
                    <span className="w-[16px] h-[16px] rounded-full border border-[#c0c0c0] flex items-center justify-center shrink-0 group-hover:border-text-secondary transition-colors">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#c0c0c0] group-hover:text-text-secondary transition-colors">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                    <span className="text-[14px] font-medium text-[#7f7f7f] flex-1 text-left">
                      {option.label}
                    </span>
                    <span className="text-[14px] font-medium text-[#8d9b76]">
                      {option.price}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
          {t("description")}<span className="text-[#c0c0c0]">*</span>
        </h3>
        <p className="text-sm font-medium text-[#c0c0c0]">
          {t("descriptionHint")}
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full h-[130px] bg-[#f5f5f5] text-sm outline-none resize-none p-3"
        />
      </div>

      {/* References */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
          {t("references")}
        </h3>
        <p className="text-sm font-medium text-[#c0c0c0] leading-relaxed">
          {t("referencesHint")}
          <br />
          {t("referencesFormat")}
        </p>
        <div className="flex gap-[15px] mt-1">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              className="w-5 h-5 rounded-full border border-[#c0c0c0] flex items-center justify-center text-[#c0c0c0] hover:border-text-secondary hover:text-text-secondary transition-colors"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          ))}
        </div>
        <textarea
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          className="mt-1 w-full h-[100px] bg-[#f5f5f5] text-sm outline-none resize-none p-3"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
          {t("email")}<span className="text-[#c0c0c0]">*</span>
        </h3>
        <p className="text-sm font-medium text-[#c0c0c0]">
          {t("emailHint")}
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full lg:w-[15.5vw] h-[30px] border border-[#c0c0c0] px-3 text-sm outline-none focus:border-text transition-colors"
        />
      </div>

      {/* Terms */}
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          onClick={() => setTermsAccepted(!termsAccepted)}
          className={`w-[18px] h-[18px] rounded-full border-2 border-[#c0c0c0] flex-shrink-0 flex items-center justify-center transition-colors ${
            termsAccepted ? "bg-text-secondary border-text-secondary" : ""
          }`}
        >
          {termsAccepted && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <span className="text-sm font-medium text-text-secondary opacity-65">
          {t("termsPrefix")}
          <a href="#" className="font-semibold underline">
            {t("termsConditions")}
          </a>
          {t("termsAnd")}
          <a href="#" className="font-semibold underline">
            {t("privacyPolicy")}
          </a>
        </span>
      </label>

      {/* Price */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
              {t("price")}
            </h3>
            <p className="text-sm font-medium text-[#c0c0c0]">
              {t("priceHint")}
            </p>
          </div>
          <span className={`text-[21px] font-bold tracking-[4.2px] ${totalPrice > 0 ? "text-[#b2c19a]" : "text-[#c0c0c0]"}`}>
            {totalPrice > 0 ? `~ ${totalPrice}$` : "0$"}
          </span>
        </div>
      </div>

      {/* Go To Conditions */}
      <button
        type="button"
        disabled={!name.trim() || !selected.length || !description.trim() || !email.trim() || submitting || submitted}
        onClick={() => {
          setSubmitting(true);
          Promise.all([
            fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name.trim(),
                projectName: projectName.trim() || undefined,
                themes: selected,
                description: description.trim(),
                email: email.trim(),
                references: references.trim() || undefined,
                totalPrice,
              }),
            }),
            fetch("/api/stats/order-click", { method: "POST" }),
          ])
            .then(() => setSubmitted(true))
            .catch(() => {})
            .finally(() => setSubmitting(false));
        }}
        className={`relative w-full lg:w-[15.5vw] h-[30px] border flex items-center justify-center text-sm font-bold tracking-[2.8px] transition-colors ${
          submitted
            ? "border-[#b2c19a] text-[#b2c19a] cursor-default"
            : name.trim() && selected.length && description.trim() && email.trim() && !submitting
              ? "border-[#c0c0c0] text-[#c0c0c0] hover:border-text-secondary hover:text-text-secondary cursor-pointer"
              : "border-[#e0e0e0] text-[#e0e0e0] cursor-not-allowed"
        }`}
      >
        <span>{submitted ? "ORDER SENT" : submitting ? "SENDING..." : t("goToConditions")}</span>
        <svg
          className="absolute right-3"
          width="8"
          height="14"
          viewBox="0 0 8 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1L7 7L1 13" />
        </svg>
      </button>
    </div>
  );
}
