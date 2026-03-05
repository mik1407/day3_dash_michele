"use client";

import { useCallback, useState } from "react";
import { Dices } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function generateRandom() {
  return Math.floor(Math.random() * 1000);
}

export function MockWidget() {
  const [value, setValue] = useState(generateRandom);

  const regenerate = useCallback(() => {
    setValue(generateRandom());
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="size-5" />
          Random Number
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <span className="text-5xl font-bold tabular-nums tracking-tight">
          {value}
        </span>
        <Button variant="outline" size="sm" onClick={regenerate}>
          Regenerate
        </Button>
      </CardContent>
    </Card>
  );
}
