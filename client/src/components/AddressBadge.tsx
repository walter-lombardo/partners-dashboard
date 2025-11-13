import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddressBadgeProps {
  address: string;
  onUpdate?: (address: string) => void;
  editable?: boolean;
}

export function AddressBadge({ address, editable = false }: AddressBadgeProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const maskAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Bitcoin address has been copied",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!address) {
    return (
      <div className="text-sm text-muted-foreground">
        No Bitcoin address set
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono" data-testid="text-bitcoin-address">
        {isRevealed ? address : maskAddress(address)}
      </code>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsRevealed(!isRevealed)}
        data-testid="button-reveal-address"
      >
        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        data-testid="button-copy-address"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}
