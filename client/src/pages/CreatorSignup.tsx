import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertCircle } from "lucide-react";

export default function CreatorSignup() {
  const [role, setRole] = useState<"creator" | "agency">("creator");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    city: "",
    aadhar: "",
    pan: "",
    bankAccount: "",
    ifsc: "",
    referralCode: "",
  });

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <main className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {role === "creator" ? "Creator" : "Agency"} Registration
          </h1>
          <p className="text-muted-foreground">Join the LINKY platform</p>
        </div>

        <Card className="p-6 mb-6">
          <Label className="mb-2 block">I am a:</Label>
          <div className="flex gap-3">
            <Button
              variant={role === "creator" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("creator")}
              data-testid="button-role-creator"
            >
              Creator
            </Button>
            <Button
              variant={role === "agency" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("agency")}
              data-testid="button-role-agency"
            >
              Agency
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                data-testid="input-age"
              />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                data-testid="input-city"
              />
            </div>

            <div>
              <Label htmlFor="aadhar">Aadhar Number *</Label>
              <Input
                id="aadhar"
                value={formData.aadhar}
                onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
                data-testid="input-aadhar"
              />
            </div>

            <div>
              <Label htmlFor="pan">PAN Number *</Label>
              <Input
                id="pan"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                data-testid="input-pan"
              />
            </div>

            <div>
              <Label htmlFor="bankAccount">Bank Account Number *</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                data-testid="input-bank-account"
              />
            </div>

            <div>
              <Label htmlFor="ifsc">IFSC Code *</Label>
              <Input
                id="ifsc"
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                data-testid="input-ifsc"
              />
            </div>

            <div>
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input
                id="referral"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                placeholder="Enter agency or creator code"
                data-testid="input-referral"
              />
            </div>
          </div>

          <div>
            <Label>Upload Documents</Label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-upload-aadhar">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Aadhar Card</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-upload-pan">
                <Upload className="w-5 h-5" />
                <span className="text-sm">PAN Card</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-upload-photo">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Profile Photo</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-upload-bank">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Bank Passbook</span>
              </Button>
            </div>
          </div>

          <Card className="p-4 bg-warning/10 border-warning/20">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• All profile changes require admin approval</li>
                  <li>• Price per minute is set by admin only</li>
                  <li>• Referral code cannot be changed after signup</li>
                  <li>• KYC documents verified once, no resubmission needed</li>
                </ul>
              </div>
            </div>
          </Card>

          <Button className="w-full" data-testid="button-submit-signup">
            Submit for Approval
          </Button>
        </Card>
      </main>
    </div>
  );
}
