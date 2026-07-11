import { signInWithGoogleAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/auth/google-icon";

export function GoogleSignInButton({
  callbackUrl,
  configured,
}: {
  callbackUrl?: string;
  configured: boolean;
}) {
  if (!configured) return null;

  return (
    <div className="space-y-4">
      <form action={signInWithGoogleAction.bind(null, callbackUrl ?? "/dashboard")}>
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon className="size-4" /> Continue with Google
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
}
