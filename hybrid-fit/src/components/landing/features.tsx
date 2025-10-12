import { Dumbbell, Calendar, BarChart3, Target } from "lucide-react";

const features = [
    {
        icon: <Dumbbell className="h-8 w-8 text-primary" />,
        title: "Browse Exercises",
        description: "Explore over 1,000 curated exercises and drills for every sport.",
    },
    {
        icon: <Calendar className="h-8 w-8 text-primary" />,
        title: "Follow Training Plans",
        description: "Access structured plans like Hal Higdon’s programs and others.",
    },
    {
        icon: <BarChart3 className="h-8 w-8 text-primary" />,
        title: "Track Your Progress",
        description: "Save workouts, mark completion, and visualize improvements.",
    },
    {
        icon: <Target className="h-8 w-8 text-primary" />,
        title: "Personalize Your Goals",
        description: "Filter by sport, skill level, or focus area to train smarter.",
    },
];

export function Features() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold mb-12">How It Works</h2>
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((f) => (
                        <div key={f.title} className="flex flex-col items-center">
                            <div className="mb-4">{f.icon}</div>
                            <h3 className="text-lg font-semibold">{f.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
