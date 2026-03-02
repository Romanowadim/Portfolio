"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function OrderForm() {
  const t = useTranslations("order");
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="flex flex-col gap-10 w-full lg:max-w-[24vw]">
      {/* Theme */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
          {t("theme")}
        </h3>
        <p className="text-sm font-medium text-[#c0c0c0]">
          {t("themeHint")}
        </p>
        <div className="relative mt-1">
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
            type="text"
            className="w-full lg:w-[15.5vw] h-[30px] border border-[#c0c0c0] pl-9 pr-3 text-sm outline-none focus:border-text transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
          {t("description")}
        </h3>
        <p className="text-sm font-medium text-[#c0c0c0]">
          {t("descriptionHint")}
        </p>
        <textarea
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
          className="mt-1 w-full h-[100px] bg-[#f5f5f5] text-sm outline-none resize-none p-3"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold tracking-[2.8px] text-text-secondary uppercase">
          {t("email")}
        </h3>
        <p className="text-sm font-medium text-[#c0c0c0]">
          {t("emailHint")}
        </p>
        <input
          type="email"
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
          <span className="text-[21px] font-bold text-[#b2c19a] tracking-[4.2px]">
            {t("priceValue")}
          </span>
        </div>
      </div>

      {/* Go To Conditions */}
      <button
        type="button"
        className="relative w-full lg:w-[15.5vw] h-[30px] border border-[#c0c0c0] flex items-center justify-center text-sm font-bold tracking-[2.8px] text-[#c0c0c0] hover:border-text-secondary hover:text-text-secondary transition-colors"
      >
        <span>{t("goToConditions")}</span>
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
