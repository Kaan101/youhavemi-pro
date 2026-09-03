"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

interface TenantSettings {
  identityMode: "phone" | "external_id" | "both";
  anonymitySide: "sender" | "both" | "none";
  messageRetentionDays: number | null;
  guardrailEnabled: boolean;
  dailyMessageLimit: number | null;
}

interface Tenant {
  id: string;
  name: string;
  isActive: boolean;
  settings: Partial<TenantSettings>;
  webhookUrl: string | null;
  createdAt: string;
}

// Kullanici istegi: PowerShell komutlari yerine, kiraci
// olusturma/ayar yonetimini bir arayuzden yapabilme - kurumsal,
// sade bir admin ekrani.
export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTenantName, setNewTenantName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedApiKey, setNewlyCreatedApiKey] = useState<string | null>(null);

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<Partial<TenantSettings>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [platformOverrides, setPlatformOverrides] = useState<Partial<TenantSettings>>({});
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("yhmp_admin_secret");
    if (stored) {
      setAdminSecret(stored);
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  function handleUnlock() {
    sessionStorage.setItem("yhmp_admin_secret", adminSecret);
    setIsUnlocked(true);
  }

  async function fetchTenants() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tenants`, {
        headers: { "x-admin-secret": adminSecret },
      });
      if (!res.ok) throw new Error();
      setTenants(await res.json());
    } catch {
      setError("Kiracılar yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTenant() {
    if (!newTenantName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ name: newTenantName.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNewlyCreatedApiKey(data.apiKey);
      setNewTenantName("");
      await fetchTenants();
    } catch {
      setError("Kiracı oluşturulamadı.");
    } finally {
      setIsCreating(false);
    }
  }

  function openSettingsEditor(tenant: Tenant) {
    setSelectedTenantId(tenant.id);
    setSettingsDraft(tenant.settings ?? {});
  }

  async function handleSaveSettings() {
    if (!selectedTenantId) return;
    setIsSavingSettings(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tenants/${selectedTenantId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify(settingsDraft),
      });
      if (!res.ok) throw new Error();
      await fetchTenants();
      setSelectedTenantId(null);
    } catch {
      setError("Ayarlar kaydedilemedi.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleSavePlatformPolicy() {
    setIsSavingPolicy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/tenants/platform-policy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify(platformOverrides),
      });
      if (!res.ok) throw new Error();
      alert("Platform politikası güncellendi.");
    } catch {
      setError("Platform politikası kaydedilemedi.");
    } finally {
      setIsSavingPolicy(false);
    }
  }

  if (!isUnlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-ink">Yönetim Girişi</h1>
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="Admin anahtarı"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleUnlock}
            disabled={!adminSecret}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Giriş Yap
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-2xl font-semibold text-ink">YouHaveMi Pro — Yönetim</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {isLoading && <p className="text-sm text-slate-500">Yükleniyor...</p>}

        {/* Yeni kiraci olusturma */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-base font-semibold text-ink">Yeni Kiracı Oluştur</h2>
          <div className="flex gap-2">
            <input
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              placeholder="Kiracı adı (örn. Acme Uygulaması)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleCreateTenant}
              disabled={isCreating || !newTenantName.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCreating ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </div>
          {newlyCreatedApiKey && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
              <p className="font-semibold text-amber-800">
                API anahtarı (bir daha gösterilmeyecek, şimdi kopyala):
              </p>
              <code className="block mt-1 break-all text-amber-900">{newlyCreatedApiKey}</code>
            </div>
          )}
        </section>

        {/* Kiraci listesi */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink">Kiracılar ({tenants.length})</h2>
          <div className="space-y-2">
            {tenants.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.id}</p>
                  </div>
                  <button
                    onClick={() => openSettingsEditor(t)}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Ayarları Düzenle
                  </button>
                </div>

                {selectedTenantId === t.id && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Kimlik Modu
                      </label>
                      <select
                        value={settingsDraft.identityMode ?? "phone"}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            identityMode: e.target.value as TenantSettings["identityMode"],
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="phone">Telefon zorunlu</option>
                        <option value="external_id">Sadece dış kimlik</option>
                        <option value="both">İkisi de kabul</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Anonimlik
                      </label>
                      <select
                        value={settingsDraft.anonymitySide ?? "sender"}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            anonymitySide: e.target.value as TenantSettings["anonymitySide"],
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="sender">Sadece gönderen anonim</option>
                        <option value="both">Her iki taraf anonim</option>
                        <option value="none">Anonimlik yok</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={settingsDraft.guardrailEnabled ?? true}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            guardrailEnabled: e.target.checked,
                          }))
                        }
                      />
                      İçerik denetimi (guardrail) açık
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isSavingSettings ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                      <button
                        onClick={() => setSelectedTenantId(null)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Platform politikasi */}
        <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5 space-y-3">
          <h2 className="text-base font-semibold text-ink">
            Platform Politikası (Tüm Kiracıları Zorlar)
          </h2>
          <p className="text-xs text-slate-500">
            Buradaki bir ayar, kiracının kendi seçimine bakılmaksızın TÜM kiracılar için geçerli
            olur.
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={platformOverrides.guardrailEnabled ?? false}
              onChange={(e) =>
                setPlatformOverrides((prev) => ({
                  ...prev,
                  guardrailEnabled: e.target.checked,
                }))
              }
            />
            İçerik denetimini (guardrail) tüm kiracılar için zorunlu kıl
          </label>
          <button
            onClick={handleSavePlatformPolicy}
            disabled={isSavingPolicy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSavingPolicy ? "Kaydediliyor..." : "Platform Politikasını Güncelle"}
          </button>
        </section>
      </div>
    </main>
  );
}
