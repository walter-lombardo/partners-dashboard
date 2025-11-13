import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import btcLogo from "@assets/bitcoin-btc-logo_1762387824260.png";
import ethLogo from "@assets/ethereum-eth-logo_1762387824260.png";
import solLogo from "@assets/solana-sol-logo_1762387824261.png";
import runeLogo from "@assets/thorchain-rune-logo_1762387824257.png";

interface RouteCardProps {
  name: string;
  ticker: string;
  amount: string;
  change: number;
  logoUrl: string;
  showZero?: boolean;
}

function RouteCard({ name, ticker, amount, change, logoUrl, showZero }: RouteCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="border-card-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className={`w-10 h-10 object-contain ${showZero ? 'blur-sm opacity-40' : ''}`}
            />
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-medium text-foreground ${showZero ? 'blur-sm opacity-40' : ''}`}>{name}</span>
            <span className={`text-xs text-muted-foreground ${showZero ? 'blur-sm opacity-40' : ''}`}>{ticker}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold font-tabular">{showZero ? '$0.00' : amount}</div>
          <div className={`flex items-center gap-1 text-xs font-medium ${showZero ? 'text-muted-foreground' : isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showZero ? '0.0' : Math.abs(change).toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TopRoutesProps {
  showZero?: boolean;
}

export function TopRoutes({ showZero }: TopRoutesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RouteCard
        name="Bitcoin"
        ticker="BTC"
        amount="$24,300.40"
        change={1.2}
        logoUrl={btcLogo}
        showZero={showZero}
      />
      <RouteCard
        name="Ethereum"
        ticker="ETH"
        amount="$13,400.20"
        change={0.4}
        logoUrl={ethLogo}
        showZero={showZero}
      />
      <RouteCard
        name="Solana"
        ticker="SOL"
        amount="$4,000.80"
        change={3.4}
        logoUrl={solLogo}
        showZero={showZero}
      />
      <RouteCard
        name="THORChain"
        ticker="RUNE"
        amount="$1,900.10"
        change={-0.9}
        logoUrl={runeLogo}
        showZero={showZero}
      />
    </div>
  );
}
