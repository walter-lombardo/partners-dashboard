import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, ChevronLeft, Trash2, AlertCircle, X } from "lucide-react";
import type { ApiKey } from "@shared/schema";

// Fee tier type
type FeeTier = {
  id: string;
  minThreshold: number;
  maxThreshold: number | null; // null means infinite
  basisPoints: number;
};
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// API response type with serialized dates
type ApiKeyResponse = Omit<ApiKey, "createdAt"> & { createdAt: string };

// Asset lists per chain
const MAYA_ASSETS = ["CACAO", "BTC", "ZEC", "RUNE", "ETH", "ETH.USDT", "DASH", "ETH.USDC", "XRD", "KUJI"];
const THORCHAIN_ASSETS = [
  "RUNE", "BTC", "ETH.USDC", "ETH.USDT", "BCH", "BNB", "DOGE", "LTC",
  "AVAX", "XRP", "AVAX.USDC", "ATOM", "BNB.USDC", "BNB.USDT", "ETH.DAI",
  "AVAX.USDT", "BASE.USDC", "BASE.ETH"
];

// Asset logo mapping
const ASSET_LOGOS: Record<string, string> = {
  "CACAO": "/cacao.webp",
  "BTC": "/bitcoin.webp",
  "ZEC": "/circle-zcash-color.webp",
  "RUNE": "/Rune200x200.webp",
  "ETH": "/ethereum.webp",
  "ETH.USDT": "/Tether.webp",
  "ETH.USDC": "/usdc.webp",
  "DASH": "/dash-logo.webp",
  "XRD": "/xrd.svg",
  "KUJI": "/kuji-200x200.webp",
  "BCH": "/bitcoin-cash-circle.webp",
  "BNB": "/bitcoin.webp", // Fallback until BNB logo is provided
  "BNB.USDC": "/usdc.webp",
  "BNB.USDT": "/Tether.webp",
  "DOGE": "/dogecoin.webp",
  "LTC": "/litecoin.webp",
  "AVAX": "/Avalanche_Circle_RedWhite_Trans.webp",
  "AVAX.USDC": "/usdc.webp",
  "AVAX.USDT": "/Tether.webp",
  "XRP": "/xrp-symbol-white-128.webp",
  "ATOM": "/cosmos_hub.webp",
  "ETH.DAI": "/Badge_Dai.webp",
  "BASE.USDC": "/base.webp",
  "BASE.ETH": "/base.webp",
};

// Get logo for asset
function getAssetLogo(asset: string): string {
  return ASSET_LOGOS[asset] || "/bitcoin.webp"; // Fallback to bitcoin logo
}

// Asset select component with icon
function AssetSelect({
  value,
  onValueChange,
  assets,
  defaultAsset,
  disabled = false
}: {
  value?: string;
  onValueChange: (value: string) => void;
  assets: string[];
  defaultAsset: string;
  disabled?: boolean;
}) {
  const selectedAsset = value || defaultAsset;

  return (
    <Select value={selectedAsset} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-10">
        <SelectValue>
          <div className="flex items-center gap-2">
            <img
              src={getAssetLogo(selectedAsset)}
              alt={selectedAsset}
              className="h-5 w-5 rounded-full object-cover"
            />
            <span>{selectedAsset}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {assets.map((asset) => (
          <SelectItem key={asset} value={asset}>
            <div className="flex items-center gap-2">
              <img
                src={getAssetLogo(asset)}
                alt={asset}
                className="h-5 w-5 rounded-full object-cover"
              />
              <span>{asset}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ApiKeyDetailsPage() {
  const [, params] = useRoute("/api-keys/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"affiliate" | "settings">("affiliate");

  // Form states for each chain
  const [thorchainAsset, setThorchainAsset] = useState("RUNE");
  const [mayaAsset, setMayaAsset] = useState("CACAO");

  // Fee tiers state - initialized with one example tier
  const [generalFeeTiers, setGeneralFeeTiers] = useState<FeeTier[]>([
    { id: crypto.randomUUID(), minThreshold: 101, maxThreshold: 1000, basisPoints: 0 }
  ]);
  const [thorchainFeeTiers, setThorchainFeeTiers] = useState<FeeTier[]>([]);
  const [mayaFeeTiers, setMayaFeeTiers] = useState<FeeTier[]>([]);

  const keyId = params?.id;

  const { data: apiKeys = [] } = useQuery<ApiKeyResponse[]>({
    queryKey: ["/api/keys"],
    staleTime: Infinity,
  });

  const apiKey = apiKeys.find((k) => k.id === keyId);

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/keys/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({
        title: "API key deleted",
        description: "The API key has been deleted successfully",
      });
      setLocation("/api-keys");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete API key",
        description: error.message || "Could not delete API key",
        variant: "destructive",
      });
    },
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard",
    });
  };

  const handleDelete = () => {
    if (keyId) {
      deleteKeyMutation.mutate(keyId);
    }
  };

  const handleSave = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} configuration has been saved successfully`,
    });
  };

  // Fee tier handlers
  const addTier = (type: 'general' | 'thorchain' | 'maya', isInfinite = false) => {
    const newTier: FeeTier = {
      id: crypto.randomUUID(),
      minThreshold: 0,
      maxThreshold: isInfinite ? null : 0,
      basisPoints: 0,
    };

    if (type === 'general') {
      setGeneralFeeTiers([...generalFeeTiers, newTier]);
    } else if (type === 'thorchain') {
      setThorchainFeeTiers([...thorchainFeeTiers, newTier]);
    } else if (type === 'maya') {
      setMayaFeeTiers([...mayaFeeTiers, newTier]);
    }
  };

  const removeTier = (type: 'general' | 'thorchain' | 'maya', tierId: string) => {
    if (type === 'general') {
      setGeneralFeeTiers(generalFeeTiers.filter(t => t.id !== tierId));
    } else if (type === 'thorchain') {
      setThorchainFeeTiers(thorchainFeeTiers.filter(t => t.id !== tierId));
    } else if (type === 'maya') {
      setMayaFeeTiers(mayaFeeTiers.filter(t => t.id !== tierId));
    }
  };

  const updateTier = (type: 'general' | 'thorchain' | 'maya', tierId: string, field: keyof FeeTier, value: number | null) => {
    const updateFn = (tiers: FeeTier[]) =>
      tiers.map(tier => tier.id === tierId ? { ...tier, [field]: value } : tier);

    if (type === 'general') {
      setGeneralFeeTiers(updateFn(generalFeeTiers));
    } else if (type === 'thorchain') {
      setThorchainFeeTiers(updateFn(thorchainFeeTiers));
    } else if (type === 'maya') {
      setMayaFeeTiers(updateFn(mayaFeeTiers));
    }
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">API key not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/api-keys")}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">{apiKey.name}</h1>
      </div>

      {/* API Key Display */}
      <div className="flex items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="flex-1 min-w-0">
          <Label className="text-xs text-muted-foreground font-normal">API Key</Label>
          <code className="text-sm font-mono block truncate">{apiKey.key}</code>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleCopyKey(apiKey.key)}
          className="shrink-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("affiliate")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "affiliate"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Affiliate config
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "settings"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Affiliate Config Content */}
      {activeTab === "affiliate" && (
        <div className="space-y-6">
          {/* Section Header */}
          <div>
            <h2 className="text-lg font-semibold">Affiliate config</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure settings related to affiliates and earnings
            </p>
          </div>

          {/* Configuration needed banner */}
          <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Configuration needed</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Complete the setup below to start earning affiliate fees
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {/* General Config */}
            <AccordionItem value="general" className="border rounded-xl bg-card/50 px-6">
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3">
                  <span className="font-medium">General config</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  Global config shared across all providers. You can override these values in each provider section.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Affiliate fee tiers</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Define fee structures based on transaction volume
                      </p>
                    </div>
                  </div>

                  {/* Dynamic tiers */}
                  <div className="space-y-3">
                    {generalFeeTiers.map((tier) => (
                      <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-normal">Min. threshold (USD)</Label>
                          <Input
                            type="number"
                            value={tier.minThreshold}
                            onChange={(e) => updateTier('general', tier.id, 'minThreshold', Number(e.target.value))}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-normal">
                            {tier.maxThreshold === null ? "Max. threshold (∞)" : "Max. threshold (USD)"}
                          </Label>
                          <Input
                            type="number"
                            value={tier.maxThreshold ?? ''}
                            onChange={(e) => updateTier('general', tier.id, 'maxThreshold', e.target.value ? Number(e.target.value) : null)}
                            className="h-10"
                            disabled={tier.maxThreshold === null}
                            placeholder={tier.maxThreshold === null ? "∞" : "0"}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-normal">Basis points</Label>
                          <Input
                            type="number"
                            value={tier.basisPoints}
                            onChange={(e) => updateTier('general', tier.id, 'basisPoints', Number(e.target.value))}
                            className="h-10"
                            placeholder="0"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTier('general', tier.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addTier('general')}>Add tier</Button>
                    <Button variant="outline" size="sm" onClick={() => addTier('general', true)}>
                      <span className="mr-1">∞</span> Infinite tier
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={() => handleSave("General config")}>Save changes</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* THORChain Affiliate */}
            <AccordionItem value="thorchain" className="border rounded-xl bg-card/50 px-6">
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3">
                  <img src="/thorchain.png" alt="THORChain" className="h-5 w-5 rounded-full object-cover" />
                  <span className="font-medium">THORChain Affiliate</span>
                  <div className="flex items-center gap-1 text-orange-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-normal">Setup required</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6">
                {/* THORName */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="thorname" className="text-sm font-medium">
                      THORName
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose an existing THORName or register a new one
                    </p>
                  </div>
                  <Input
                    id="thorname"
                    placeholder="Enter your THORName (3+ characters)"
                    className="h-10"
                  />
                </div>

                {/* Wallet Connection */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to select an existing THORName tied to your wallet
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <span className="mr-2">🔗</span> Connect wallet
                    </Button>
                    <Button variant="outline">Register new</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="manual-thor" className="rounded" />
                    <Label htmlFor="manual-thor" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                      Enter affiliate name manually
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-muted-foreground">(advanced)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">For advanced users who want to manually specify affiliate names</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>
                </div>

                {/* Fee Tiers */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">Affiliate fee tiers</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Override global fee tiers for THORChain-specific rates
                    </p>
                  </div>

                  {thorchainFeeTiers.length > 0 && (
                    <div className="space-y-3">
                      {thorchainFeeTiers.map((tier) => (
                        <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-normal">Min. threshold (USD)</Label>
                            <Input
                              type="number"
                              value={tier.minThreshold}
                              onChange={(e) => updateTier('thorchain', tier.id, 'minThreshold', Number(e.target.value))}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-normal">
                              {tier.maxThreshold === null ? "Max. threshold (∞)" : "Max. threshold (USD)"}
                            </Label>
                            <Input
                              type="number"
                              value={tier.maxThreshold ?? ''}
                              onChange={(e) => updateTier('thorchain', tier.id, 'maxThreshold', e.target.value ? Number(e.target.value) : null)}
                              className="h-10"
                              disabled={tier.maxThreshold === null}
                              placeholder={tier.maxThreshold === null ? "∞" : "0"}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-normal">Basis points</Label>
                            <Input
                              type="number"
                              value={tier.basisPoints}
                              onChange={(e) => updateTier('thorchain', tier.id, 'basisPoints', Number(e.target.value))}
                              className="h-10"
                              placeholder="0"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                            onClick={() => removeTier('thorchain', tier.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addTier('thorchain')}>Add tier</Button>
                    <Button variant="outline" size="sm" onClick={() => addTier('thorchain', true)}>
                      <span className="mr-1">∞</span> Infinite tier
                    </Button>
                  </div>
                </div>

                {/* Preferred Fee Asset */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Preferred fee asset</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select the asset you want to accumulate fees in
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">Asset</Label>
                      <AssetSelect
                        value={thorchainAsset}
                        onValueChange={setThorchainAsset}
                        assets={THORCHAIN_ASSETS}
                        defaultAsset="RUNE"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="thor-payout" className="text-sm font-normal">
                        Payout address
                      </Label>
                      <p className="text-xs text-muted-foreground">Where fees will be sent</p>
                      <Input
                        id="thor-payout"
                        placeholder="Enter payout address..."
                        className="h-10 font-mono text-sm"
                      />
                    </div>

                    <Button variant="outline">
                      <span className="mr-2">🔗</span> Connect wallet
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button onClick={() => handleSave("THORChain Affiliate")}>Save changes</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Maya Affiliate */}
            <AccordionItem value="maya" className="border rounded-xl bg-card/50 px-6">
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3">
                  <img src="/maya.png" alt="Maya Protocol" className="h-5 w-5 rounded-full object-cover" />
                  <span className="font-medium">Maya Affiliate</span>
                  <div className="flex items-center gap-1 text-orange-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-normal">Setup required</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6">
                {/* MayaName */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="mayaname" className="text-sm font-medium">
                      MayaName
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose an existing MayaName or register a new one
                    </p>
                  </div>
                  <Input
                    id="mayaname"
                    placeholder="Enter your MayaName (3+ characters)"
                    className="h-10"
                  />
                </div>

                {/* Wallet Connection */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to select an existing MayaName tied to your wallet
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <span className="mr-2">🔗</span> Connect wallet
                    </Button>
                    <Button variant="outline">Register new</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="manual-maya" className="rounded" />
                    <Label htmlFor="manual-maya" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                      Enter affiliate name manually
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-muted-foreground">(advanced)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">For advanced users who want to manually specify affiliate names</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>
                </div>

                {/* Fee Tiers */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">Affiliate fee tiers</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Override global fee tiers for Maya-specific rates
                    </p>
                  </div>

                  {mayaFeeTiers.length > 0 && (
                    <div className="space-y-3">
                      {mayaFeeTiers.map((tier) => (
                        <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-normal">Min. threshold (USD)</Label>
                            <Input
                              type="number"
                              value={tier.minThreshold}
                              onChange={(e) => updateTier('maya', tier.id, 'minThreshold', Number(e.target.value))}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-normal">
                              {tier.maxThreshold === null ? "Max. threshold (∞)" : "Max. threshold (USD)"}
                            </Label>
                            <Input
                              type="number"
                              value={tier.maxThreshold ?? ''}
                              onChange={(e) => updateTier('maya', tier.id, 'maxThreshold', e.target.value ? Number(e.target.value) : null)}
                              className="h-10"
                              disabled={tier.maxThreshold === null}
                              placeholder={tier.maxThreshold === null ? "∞" : "0"}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-normal">Basis points</Label>
                            <Input
                              type="number"
                              value={tier.basisPoints}
                              onChange={(e) => updateTier('maya', tier.id, 'basisPoints', Number(e.target.value))}
                              className="h-10"
                              placeholder="0"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                            onClick={() => removeTier('maya', tier.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addTier('maya')}>Add tier</Button>
                    <Button variant="outline" size="sm" onClick={() => addTier('maya', true)}>
                      <span className="mr-1">∞</span> Infinite tier
                    </Button>
                  </div>
                </div>

                {/* Preferred Fee Asset */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Preferred fee asset</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select the asset you want to accumulate fees in
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-normal">Asset</Label>
                      <AssetSelect
                        value={mayaAsset}
                        onValueChange={setMayaAsset}
                        assets={MAYA_ASSETS}
                        defaultAsset="CACAO"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="maya-payout" className="text-sm font-normal">
                        Payout address
                      </Label>
                      <p className="text-xs text-muted-foreground">Where fees will be sent</p>
                      <Input
                        id="maya-payout"
                        placeholder="Enter payout address..."
                        className="h-10 font-mono text-sm"
                      />
                    </div>

                    <Button variant="outline">
                      <span className="mr-2">🔗</span> Connect wallet
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button onClick={() => handleSave("Maya Affiliate")}>Save changes</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Chainflip Affiliate */}
            <AccordionItem value="chainflip" className="border rounded-xl bg-card/50 px-6">
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3">
                  <img src="/chainflip.png" alt="Chainflip" className="h-5 w-5 rounded-full object-cover" />
                  <span className="font-medium">Chainflip Affiliate</span>
                  <div className="flex items-center gap-1 text-orange-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-normal">Setup required</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cf-affiliate" className="text-sm font-medium">
                      Affiliate address
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your Chainflip affiliate broker address
                    </p>
                  </div>
                  <Input
                    id="cf-affiliate"
                    placeholder="Enter affiliate address..."
                    className="h-10 font-mono text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cf-withdrawal" className="text-sm font-medium">
                      Fees withdrawal address
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">The address where your earned fees will be withdrawn</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="cf-withdrawal"
                      placeholder="Enter withdrawal address..."
                      className="h-10 font-mono text-sm flex-1"
                    />
                    <Button variant="outline">Register</Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button onClick={() => handleSave("Chainflip Affiliate")}>Save changes</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Delete Section */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex items-start justify-between p-6 rounded-xl border border-destructive/20 bg-destructive/5">
              <div className="space-y-1">
                <h3 className="font-medium text-destructive">Delete API Key</h3>
                <p className="text-sm text-muted-foreground">
                  Once you delete an API key, there is no going back. Please be certain.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Settings configuration coming soon</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the API key "<span className="font-medium text-foreground">{apiKey.name}</span>" and remove all associated configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
