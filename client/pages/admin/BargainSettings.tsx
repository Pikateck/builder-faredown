import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import {
  adminBargainService,
  BargainSettings,
  AnalyticsSummary,
} from "@/services/adminBargainService";
import { useAuth } from "@/contexts/AuthContext";

type Module =
  | "hotels"
  | "flights"
  | "sightseeing"
  | "transfers"
  | "packages"
  | "addons";

const MODULE_LABELS: Record<Module, string> = {
  hotels: "Hotels",
  flights: "Flights",
  sightseeing: "Sightseeing",
  transfers: "Transfers",
  packages: "Packages",
  addons: "Add-ons",
};

const MODULE_ORDER: Module[] = [
  "hotels",
  "flights",
  "sightseeing",
  "transfers",
  "packages",
  "addons",
];

export default function BargainSettingsPage() {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>("hotels");
  const [settings, setSettings] = useState<
    Record<Module, BargainSettings | null>
  >({} as any);
  const [analytics, setAnalytics] = useState<AnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all settings on mount
  useEffect(() => {
    loadAllSettings();
    loadAnalytics();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await adminBargainService.getAllSettings();

      const settingsMap: Record<Module, BargainSettings> = {} as any;
      allSettings.forEach((setting) => {
        settingsMap[setting.module] = setting;
      });

      setSettings(settingsMap);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { summary } = await adminBargainService.getAnalyticsSummary(
        undefined,
        7,
      );
      setAnalytics(summary);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const handleSave = async () => {
    const currentSettings = settings[activeModule];
    if (!currentSettings) return;

    try {
      setSaving(true);
      setSaveSuccess(false);
      setError(null);

      await adminBargainService.updateModuleSettings(
        activeModule,
        {
          enabled: currentSettings.enabled,
          attempts: currentSettings.attempts,
          r1_timer_sec: currentSettings.r1_timer_sec,
          r2_timer_sec: currentSettings.r2_timer_sec,
          discount_min_pct: currentSettings.discount_min_pct,
          discount_max_pct: currentSettings.discount_max_pct,
          show_recommended_badge: currentSettings.show_recommended_badge,
          recommended_label: currentSettings.recommended_label,
          show_standard_price_on_expiry:
            currentSettings.show_standard_price_on_expiry,
          price_match_enabled: currentSettings.price_match_enabled,
          copy_json: currentSettings.copy_json,
          experiment_flags: currentSettings.experiment_flags,
        },
        user?.email || "admin",
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadAllSettings();
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (field: keyof BargainSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [activeModule]: {
        ...prev[activeModule]!,
        [field]: value,
      },
    }));
  };

  const updateCopy = (key: string, value: string) => {
    const currentSettings = settings[activeModule];
    if (!currentSettings) return;

    setSettings((prev) => ({
      ...prev,
      [activeModule]: {
        ...prev[activeModule]!,
        copy_json: {
          ...currentSettings.copy_json,
          [key]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const currentSettings = settings[activeModule];
  const moduleAnalytics = analytics.find((a) => a.module === activeModule);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bargain Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure bargaining behavior, timers, and copy text for each module
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeModule}
        onValueChange={(v) => setActiveModule(v as Module)}
      >
        <TabsList className="grid w-full grid-cols-6">
          {MODULE_ORDER.map((module) => (
            <TabsTrigger key={module} value={module}>
              {MODULE_LABELS[module]}
            </TabsTrigger>
          ))}
        </TabsList>

        {MODULE_ORDER.map((module) => (
          <TabsContent key={module} value={module} className="space-y-6 mt-6">
            {currentSettings && (
              <>
                {/* Analytics Summary */}
                {moduleAnalytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Last 7 Days Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">
                            Total Sessions
                          </div>
                          <div className="text-2xl font-bold">
                            {moduleAnalytics.total_sessions}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Booked</div>
                          <div className="text-2xl font-bold text-green-600">
                            {moduleAnalytics.booked}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">
                            Avg Discount
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {moduleAnalytics.avg_discount_pct?.toFixed(1) ||
                              "0"}
                            %
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">
                            Avg Time to Bid
                          </div>
                          <div className="text-2xl font-bold">
                            {moduleAnalytics.avg_time_to_r1_sec?.toFixed(0) ||
                              "0"}
                            s
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Main Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Configure bargaining behavior for {MODULE_LABELS[module]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enabled" className="text-base">
                          Enable Bargaining
                        </Label>
                        <p className="text-sm text-gray-500">
                          Allow users to bargain on {MODULE_LABELS[module]}{" "}
                          bookings
                        </p>
                      </div>
                      <Switch
                        id="enabled"
                        checked={currentSettings.enabled}
                        onCheckedChange={(checked) =>
                          updateSetting("enabled", checked)
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Attempts */}
                      <div className="space-y-2">
                        <Label htmlFor="attempts">Bargain Attempts</Label>
                        <Input
                          id="attempts"
                          type="number"
                          min="0"
                          max="2"
                          value={currentSettings.attempts}
                          onChange={(e) =>
                            updateSetting("attempts", parseInt(e.target.value))
                          }
                          disabled={!currentSettings.enabled}
                        />
                        <p className="text-xs text-gray-500">
                          0 = disabled, 1 or 2 attempts
                        </p>
                      </div>

                      {/* R1 Timer */}
                      <div className="space-y-2">
                        <Label htmlFor="r1_timer">
                          Round 1 Timer (seconds)
                        </Label>
                        <Input
                          id="r1_timer"
                          type="number"
                          min="5"
                          max="120"
                          value={currentSettings.r1_timer_sec}
                          onChange={(e) =>
                            updateSetting(
                              "r1_timer_sec",
                              parseInt(e.target.value),
                            )
                          }
                          disabled={!currentSettings.enabled}
                        />
                      </div>

                      {/* R2 Timer */}
                      {currentSettings.attempts >= 2 && (
                        <div className="space-y-2">
                          <Label htmlFor="r2_timer">
                            Round 2 Timer (seconds)
                          </Label>
                          <Input
                            id="r2_timer"
                            type="number"
                            min="5"
                            max="120"
                            value={currentSettings.r2_timer_sec}
                            onChange={(e) =>
                              updateSetting(
                                "r2_timer_sec",
                                parseInt(e.target.value),
                              )
                            }
                            disabled={!currentSettings.enabled}
                          />
                        </div>
                      )}

                      {/* Discount Range */}
                      <div className="space-y-2">
                        <Label htmlFor="discount_min">Min Discount %</Label>
                        <Input
                          id="discount_min"
                          type="number"
                          min="0"
                          max="100"
                          value={currentSettings.discount_min_pct}
                          onChange={(e) =>
                            updateSetting(
                              "discount_min_pct",
                              parseInt(e.target.value),
                            )
                          }
                          disabled={!currentSettings.enabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount_max">Max Discount %</Label>
                        <Input
                          id="discount_max"
                          type="number"
                          min="0"
                          max="100"
                          value={currentSettings.discount_max_pct}
                          onChange={(e) =>
                            updateSetting(
                              "discount_max_pct",
                              parseInt(e.target.value),
                            )
                          }
                          disabled={!currentSettings.enabled}
                        />
                      </div>
                    </div>

                    {/* Badge Settings */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show_badge">
                            Show "Recommended" Badge
                          </Label>
                          <p className="text-sm text-gray-500">
                            Display badge on lower price option
                          </p>
                        </div>
                        <Switch
                          id="show_badge"
                          checked={currentSettings.show_recommended_badge}
                          onCheckedChange={(checked) =>
                            updateSetting("show_recommended_badge", checked)
                          }
                          disabled={!currentSettings.enabled}
                        />
                      </div>

                      {currentSettings.show_recommended_badge && (
                        <div className="space-y-2">
                          <Label htmlFor="badge_label">Badge Label</Label>
                          <Input
                            id="badge_label"
                            value={currentSettings.recommended_label}
                            onChange={(e) =>
                              updateSetting("recommended_label", e.target.value)
                            }
                            placeholder="Recommended"
                          />
                        </div>
                      )}
                    </div>

                    {/* Expiry Settings */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <Label htmlFor="show_standard">
                          Show "Book at Standard Price" on Expiry
                        </Label>
                        <p className="text-sm text-gray-500">
                          Display fallback option when timer expires
                        </p>
                      </div>
                      <Switch
                        id="show_standard"
                        checked={currentSettings.show_standard_price_on_expiry}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "show_standard_price_on_expiry",
                            checked,
                          )
                        }
                        disabled={!currentSettings.enabled}
                      />
                    </div>

                    {/* Price Match (Hotels only) */}
                    {module === "hotels" && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <Label htmlFor="price_match">
                            Enable Price Match Intake
                          </Label>
                          <p className="text-sm text-gray-500">
                            Allow users to submit competitor price matches
                          </p>
                        </div>
                        <Switch
                          id="price_match"
                          checked={currentSettings.price_match_enabled}
                          onCheckedChange={(checked) =>
                            updateSetting("price_match_enabled", checked)
                          }
                          disabled={!currentSettings.enabled}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Copy Text Overrides */}
                <Card>
                  <CardHeader>
                    <CardTitle>Copy Text Overrides</CardTitle>
                    <CardDescription>
                      Customize button labels and messages (use {"{price}"} and{" "}
                      {"{base}"} as placeholders)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="r1_primary">Round 1 Primary CTA</Label>
                        <Input
                          id="r1_primary"
                          value={currentSettings.copy_json.r1_primary || ""}
                          onChange={(e) =>
                            updateCopy("r1_primary", e.target.value)
                          }
                          placeholder="Book ₹{price}"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="r1_secondary">
                          Round 1 Secondary CTA
                        </Label>
                        <Input
                          id="r1_secondary"
                          value={currentSettings.copy_json.r1_secondary || ""}
                          onChange={(e) =>
                            updateCopy("r1_secondary", e.target.value)
                          }
                          placeholder="Try Final Bargain"
                        />
                      </div>

                      {currentSettings.attempts >= 2 && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="r2_low">
                              Round 2 Lower Price Label
                            </Label>
                            <Input
                              id="r2_low"
                              value={
                                currentSettings.copy_json.r2_card_low || ""
                              }
                              onChange={(e) =>
                                updateCopy("r2_card_low", e.target.value)
                              }
                              placeholder="Book ₹{price} (Best price)"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="r2_high">
                              Round 2 Higher Price Label
                            </Label>
                            <Input
                              id="r2_high"
                              value={
                                currentSettings.copy_json.r2_card_high || ""
                              }
                              onChange={(e) =>
                                updateCopy("r2_card_high", e.target.value)
                              }
                              placeholder="Book ₹{price}"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry_text">Timer Expiry Message</Label>
                      <Textarea
                        id="expiry_text"
                        value={currentSettings.copy_json.expiry_text || ""}
                        onChange={(e) =>
                          updateCopy("expiry_text", e.target.value)
                        }
                        placeholder="⌛ Time's up. This price is no longer available."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry_cta">Expiry Fallback CTA</Label>
                      <Input
                        id="expiry_cta"
                        value={currentSettings.copy_json.expiry_cta || ""}
                        onChange={(e) =>
                          updateCopy("expiry_cta", e.target.value)
                        }
                        placeholder="Book at Standard Price ₹{base}"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={loadAllSettings}
                    disabled={saving}
                  >
                    Reset
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
