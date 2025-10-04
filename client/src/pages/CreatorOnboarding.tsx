import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, CreditCard, FileText, Gift, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreatorOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountName: "",
    aadharNumber: "",
    panNumber: "",
    referralCode: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    // Validation for current step
    if (step === 1 && (!formData.name || formData.name.length < 3)) {
      toast({
        title: "Invalid Name",
        description: "Please enter your full name (minimum 3 characters)",
        variant: "destructive",
      });
      return;
    }

    if (step === 2) {
      if (!formData.bankAccountNumber || !formData.bankIfscCode || !formData.bankAccountName) {
        toast({
          title: "Incomplete Bank Details",
          description: "Please fill in all bank details",
          variant: "destructive",
        });
        return;
      }
    }

    if (step === 3) {
      if (!formData.aadharNumber || !formData.panNumber) {
        toast({
          title: "Incomplete KYC Details",
          description: "Please provide both Aadhar and PAN numbers",
          variant: "destructive",
        });
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    localStorage.setItem("creator_registered", "true");
    localStorage.setItem("creator_approval_status", "pending");
    
    toast({
      title: "Registration Submitted",
      description: "Your profile is under review. You'll be notified once approved.",
    });

    setTimeout(() => {
      setLocation("/creator/pending-approval");
    }, 1500);
  };

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Creator Registration</CardTitle>
              <span className="text-sm text-muted-foreground">Step {step} of 4</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">Let's start with your basic details</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for important notifications only
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Bank Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Bank Account Details</h3>
                    <p className="text-sm text-muted-foreground">For receiving your earnings</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountName">Account Holder Name *</Label>
                  <Input
                    id="bankAccountName"
                    placeholder="Name as per bank account"
                    value={formData.bankAccountName}
                    onChange={(e) => updateField("bankAccountName", e.target.value)}
                    data-testid="input-bank-account-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number *</Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="Enter account number"
                    value={formData.bankAccountNumber}
                    onChange={(e) => updateField("bankAccountNumber", e.target.value)}
                    data-testid="input-bank-account-number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankIfscCode">IFSC Code *</Label>
                  <Input
                    id="bankIfscCode"
                    placeholder="Enter IFSC code"
                    value={formData.bankIfscCode}
                    onChange={(e) => updateField("bankIfscCode", e.target.value.toUpperCase())}
                    data-testid="input-bank-ifsc"
                  />
                </div>
              </div>
            )}

            {/* Step 3: KYC Documents */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">KYC Documents</h3>
                    <p className="text-sm text-muted-foreground">Required for verification</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                  <Input
                    id="aadharNumber"
                    placeholder="Enter 12-digit Aadhar number"
                    value={formData.aadharNumber}
                    onChange={(e) => updateField("aadharNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                    maxLength={12}
                    data-testid="input-aadhar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    placeholder="Enter PAN number"
                    value={formData.panNumber}
                    onChange={(e) => updateField("panNumber", e.target.value.toUpperCase().slice(0, 10))}
                    maxLength={10}
                    data-testid="input-pan"
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Note:</strong> Your documents will be verified by our admin team. 
                    This process usually takes 24-48 hours.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Referral Code */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Referral Code (Optional)</h3>
                    <p className="text-sm text-muted-foreground">Have a referral code? Enter it here</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code</Label>
                  <Input
                    id="referralCode"
                    placeholder="Enter referral code"
                    value={formData.referralCode}
                    onChange={(e) => updateField("referralCode", e.target.value.toUpperCase())}
                    data-testid="input-referral"
                  />
                  <p className="text-xs text-muted-foreground">
                    Skip this step if you don't have a referral code
                  </p>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Ready to submit!</p>
                      <p className="text-muted-foreground">
                        Your profile will be reviewed by our team. You'll receive a notification 
                        once it's approved or if any changes are needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="flex-1"
                data-testid="button-next"
              >
                {step === 4 ? "Submit for Review" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
