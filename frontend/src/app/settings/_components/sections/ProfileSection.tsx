"use client";

import { useRef } from "react";
import { User, Upload, Mail, Lock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../SectionHeader";

interface ProfileSectionProps {
  displayName: string;
  email: string;
  avatar: string;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onAvatarChange: (value: string) => void;
}

export function ProfileSection({
  displayName,
  email,
  avatar,
  onDisplayNameChange,
  onEmailChange,
  onAvatarChange,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, create a local URL. In production, this would upload to storage.
      const url = URL.createObjectURL(file);
      onAvatarChange(url);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader
          icon={User}
          title="Account & Profile"
          description="Manage your personal information and account settings"
        />

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-elevated">
                <AvatarImage src={avatar} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Profile Picture</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click on the avatar to upload a new image
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload New
              </Button>
            </div>
          </div>

          <Separator />

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Display Name
            </Label>
            <Input
              id="display-name"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              This name will be displayed throughout the app
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Used for account recovery and notifications
            </p>
          </div>

          <Separator />

          {/* Password Section (Placeholder) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Password
            </Label>
            <div className="flex items-center gap-4">
              <Input
                type="password"
                value="••••••••"
                disabled
                className="max-w-md bg-elevated"
              />
              <Button variant="outline" size="sm" disabled className="gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password management will be available once authentication is
              connected
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
