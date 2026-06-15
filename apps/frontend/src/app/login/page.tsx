"use client";

import { signIn } from "@/lib/auth";
import MicrosoftLogo from "@/components/MicrosoftLogo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Login = () => {
  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] flex justify-center items-center">
      <Card
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
        className="w-md h-fit py-12 shadow-md"
      >
        <CardHeader className="flex flex-col items-center justify-center p-0">
          <CardTitle className="text-xl font-semibold">Receipt AI</CardTitle>
          <CardDescription>
            Scan and analyze your receipts with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={() => signIn()}
            className="flex items-center gap-3 bg-[#2563EB] text-white px-6 py-3 rounded-lg w-sm justify-center cursor-pointer"
          >
            <MicrosoftLogo />
            Sign in with Microsoft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
