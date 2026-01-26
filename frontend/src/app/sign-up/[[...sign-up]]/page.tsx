import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card border border-border shadow-lg rounded-xl",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
            formFieldLabel: "text-foreground",
            formFieldInput:
              "bg-background text-foreground border-border focus:ring-primary",
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/80",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
