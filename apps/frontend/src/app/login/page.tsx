import MicrosoftLogo from "@/components/MicrosoftLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";

const Login = () => {
  return (
    <div className="w-full h-full bg-[#F9FAFB] flex justify-center items-center">
      <Card
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
        className="w-md h-fit py-12 shadow-md"
      >
        <CardHeader className="flex flex-col items-center justufy-center p-0">
          <CardTitle className="text-xl font-semibold">Receipt AI</CardTitle>
          <CardDescription>
            Scan and analyze your receipts with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <button className="flex items-center gap-3 bg-[#2563EB] text-white px-6 py-3 rounded-lg w-sm justify-center">
            <MicrosoftLogo />
            Sign in with Microsoft
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
