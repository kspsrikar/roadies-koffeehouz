import { AuroraButton } from "@/components/ui/aurora-button";

function AuroraButtonDemo() {
  return <AuroraButton>Click me</AuroraButton>;
}

function AuroraButtonDemo2() {
  return <AuroraButton className="px-6 py-3">Custom Size</AuroraButton>;
}

function AuroraButtonDemo3() {
  return (
    <AuroraButton glowClassName="from-pink-500 via-purple-500 to-blue-500">
      Custom Gradient
    </AuroraButton>
  );
}

export { AuroraButtonDemo, AuroraButtonDemo2, AuroraButtonDemo3 };
