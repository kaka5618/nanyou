import { GradientCard } from "@/components/ui/gradient-card";

const cardData = [
  {
    badgeText: "Open / Invite-priority",
    badgeColor: "#F59E0B",
    title: "Companies",
    description:
      "Build teams of highly motivated tech-professionals across the globe, with projects across all industries.",
    ctaText: "Start hiring",
    ctaHref: "#",
    imageUrl:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    gradient: "orange" as const,
  },
  {
    badgeText: "Open for applications",
    badgeColor: "#4B5563",
    title: "Builders",
    description:
      "Work on your own terms in a motivating and healthy environment. You will earn TMW-tokens too!",
    ctaText: "Apply now",
    ctaHref: "#",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    gradient: "gray" as const,
  },
  {
    badgeText: "Invite only",
    badgeColor: "#8B5CF6",
    title: "Scouts",
    description:
      "As a scout you will utilize your network to refer new members and companies to earn ownership in form of TMW-tokens.",
    ctaText: "Request invite",
    ctaHref: "#",
    imageUrl:
      "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=900&q=80",
    gradient: "purple" as const,
  },
  {
    badgeText: "Invite only",
    badgeColor: "#10B981",
    title: "Partners",
    description:
      "As a partner you can offer direct access to the society to your portfolio companies, community or customers.",
    ctaText: "Get in touch",
    ctaHref: "#",
    imageUrl:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
    gradient: "green" as const,
  },
];

export default function GradientCardDemo() {
  return (
    <div className="p-4 sm:p-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
        {cardData.map((card, index) => (
          <GradientCard
            key={index}
            badgeText={card.badgeText}
            badgeColor={card.badgeColor}
            title={card.title}
            description={card.description}
            ctaText={card.ctaText}
            ctaHref={card.ctaHref}
            imageUrl={card.imageUrl}
            gradient={card.gradient}
          />
        ))}
      </div>
    </div>
  );
}
