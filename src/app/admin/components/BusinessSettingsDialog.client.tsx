"use client";

import { useCallback, useId, useState } from "react";
import { Modal } from "@/app/admin/components/Modal.client";
import { BusinessSettingsForm } from "@/app/admin/components/BusinessSettingsForm.client";
import { PostcodeSearch } from "@/components/form/PostcodeSearch.client";
import { Button } from "@/components/ui/Button";
import type { SiteConfig } from "@/shared/types/database";

const TABS = [
  { key: "cleaning", label: "청소" },
  { key: "moving", label: "이사" },
] as const;

export function BusinessSettingsDialog({
  config,
  onClose,
  onRetry,
  loading = false,
}: {
  config: SiteConfig | null;
  onRetry: () => void;
  loading?: boolean;
  onClose: () => void;
}) {
  const formId = useId();
  const [changed, setChanged] = useState({ cleaning: false, moving: false });
  const onChanged = useCallback(
    (kind: "cleaning" | "moving", value: boolean) => {
      setChanged((current) =>
        current[kind] === value ? current : { ...current, [kind]: value },
      );
    },
    [],
  );
  const [active, setActive] = useState<"cleaning" | "moving">("cleaning");
  const [saving, setSaving] = useState(false);
  const [addressSearch, setAddressSearch] = useState<{
    onSelect: (address: string) => void;
    trigger: HTMLElement | null;
  } | null>(null);
  const closeAddressSearch = () => {
    const trigger = addressSearch?.trigger;
    setAddressSearch(null);
    requestAnimationFrame(() => trigger?.focus());
  };
  return (
    <Modal
      isOpen
      onClose={addressSearch ? closeAddressSearch : onClose}
      onEscape={addressSearch ? closeAddressSearch : undefined}
      title={addressSearch ? "주소찾기" : "업체 정보"}
      size="lg"
      closeDisabled={saving || loading}
      headerDivider={false}
      headerActions={
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={saving || loading}
            onClick={addressSearch ? closeAddressSearch : onClose}
          >
            취소
          </Button>
          {!addressSearch && config && (
            <Button
              size="sm"
              type="submit"
              form={`${formId}-${active}`}
              loading={saving}
              disabled={saving || loading || !changed[active]}
            >
              저장
            </Button>
          )}
        </div>
      }
      fixedHeight
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {addressSearch && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1" data-clarity-mask="True">
            <PostcodeSearch
              style={{ height: "100%" }}
              autoClose={false}
              onComplete={(data) => {
                addressSearch.onSelect(data.address);
                setAddressSearch(null);
              }}
            />
          </div>
        </div>
      )}
      <div
        hidden={Boolean(addressSearch)}
        className={
          addressSearch
            ? undefined
            : "flex min-h-0 flex-1 flex-col overflow-hidden"
        }
      >
        {config ? (
          <>
            <div
              role="tablist"
              aria-label="업체 선택"
              className="flex shrink-0 gap-6 border-b border-slate-200 px-6"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  id={`business-tab-${tab.key}`}
                  type="button"
                  role="tab"
                  aria-selected={active === tab.key}
                  aria-controls={`business-panel-${tab.key}`}
                  tabIndex={active === tab.key ? 0 : -1}
                  onKeyDown={(event) => {
                    const index = TABS.findIndex((item) => item.key === active);
                    let next = index;
                    if (event.key === "ArrowRight")
                      next = (index + 1) % TABS.length;
                    else if (event.key === "ArrowLeft")
                      next = (index + TABS.length - 1) % TABS.length;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = TABS.length - 1;
                    else return;
                    event.preventDefault();
                    setActive(TABS[next].key);
                    document
                      .getElementById(`business-tab-${TABS[next].key}`)
                      ?.focus();
                  }}
                  disabled={saving}
                  onClick={() => setActive(tab.key)}
                  className={`border-b-2 py-4 text-sm font-bold transition-colors disabled:opacity-50 ${active === tab.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {TABS.map((tab) => (
              <div
                key={tab.key}
                id={`business-panel-${tab.key}`}
                role="tabpanel"
                aria-labelledby={`business-tab-${tab.key}`}
                hidden={active !== tab.key}
                className={
                  active === tab.key
                    ? "flex min-h-0 flex-1 flex-col"
                    : undefined
                }
              >
                <BusinessSettingsForm
                  kind={tab.key}
                  config={config}
                  onSavingChange={setSaving}
                  id={`${formId}-${tab.key}`}
                  onChanged={onChanged}
                  onAddressSearch={(onSelect) =>
                    setAddressSearch({
                      onSelect,
                      trigger:
                        document.activeElement instanceof HTMLElement
                          ? document.activeElement
                          : null,
                    })
                  }
                />
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-4 p-6">
            <p role="alert" className="text-sm text-red-600">
              업체 정보를 불러오지 못했습니다.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              loading={loading}
            >
              다시 불러오기
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
