import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, BookOpen } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Get help with your account and tracking setup</p>
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>Reach out to our team for assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild data-testid="link-contact-support">
            <a href="mailto:support@dkit.partners" className="inline-flex items-center gap-2">
              <Mail className="w-4 h-4" />
              support@dkit.partners
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              How do affiliate payouts work?
            </h3>
            <p className="text-sm text-muted-foreground">
              Affiliate fees are calculated based on the swaps attributed to your tracking IDs (THORName, MayaName, Chainflip address). 
              Payouts are sent monthly to your Bitcoin address on-chain. Make sure you have full control of the wallet you provide.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              What are tracking IDs?
            </h3>
            <p className="text-sm text-muted-foreground">
              Tracking IDs (THORName, MayaName, and Chainflip address) are unique identifiers that help us attribute swap transactions 
              to your project. When users perform swaps through your dApp using these identifiers, we track the volume and calculate 
              your affiliate fees accordingly.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              How do I update my Bitcoin address?
            </h3>
            <p className="text-sm text-muted-foreground">
              Go to the Wallet page to update your Bitcoin payout address. Make sure to use an address you fully control, as on-chain 
              payments are final and cannot be reversed. We recommend using a hardware wallet or secure self-custody solution.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Why am I not seeing any transactions?
            </h3>
            <p className="text-sm text-muted-foreground">
              If you don't see any transactions, ensure you've added your tracking IDs (THORName, MayaName, Chainflip address) in the 
              Settings page. It may take up to 24 hours for new transactions to appear after adding your tracking IDs. If you continue 
              to have issues, contact our support team.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Need more help?
            </h3>
            <p className="text-sm text-muted-foreground">
              For technical documentation, integration guides, and detailed API reference, visit our documentation portal or contact 
              our support team directly via email.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
