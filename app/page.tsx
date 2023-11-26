import { ChatWindow } from "@/app/components/ChatWindow";
import Image from "next/image";

export default function AgentsPage() {
  const InfoCard = (
    <div className="p-4 md:p-8 rounded bg-[#25252d] w-full max-h-[85%] overflow-hidden">
      <h1 className="text-2xl md:text-2xl mb-2">
        Employee Care GPT at Techcom
      </h1>
      <Image
        src="/images/banner.jpg"
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        alt="Banner"
      />
    </div>
  );
  return (
    <ChatWindow
      endpoint="api/chat"
      emptyStateComponent={InfoCard}
      placeholder={"I'm Anne, your Employee Care advisor. How can I help you?"}
      emoji="👩‍🦰"
      titleText="Employee Care GPT"
    ></ChatWindow>
  );
}
