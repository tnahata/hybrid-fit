"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Home, Calendar, TrendingUp, Settings, Menu, Bell, Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UserDoc } from "@/models/User";
import { TrainingPlanDoc } from "@models/TrainingPlans";

export default function DashboardLayouts() {
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [currentUser, setCurrentUser] = useState<UserDoc | null>();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const response: Response = await fetch("/api/users/me", {
                method: 'GET'
            });
            if (response?.ok) {
                const json = await response.json();
                console.log(json.data);
                setCurrentUser(json.data);

                if (json.trainingPlans) {
                    
                }
            }
        }
        fetchCurrentUser();
    }, []);

    // Calendar/Program data
    const programWeeks = {
        running: {
            previous: [
                {
                    week: 1, days: [
                        { day: 'Mon', workout: 'Easy Run 3mi', completed: true, notes: 'Felt great!' },
                        { day: 'Tue', workout: 'Rest', completed: true },
                        { day: 'Wed', workout: 'Easy Run 3mi', completed: true, notes: '8:45 pace' },
                        { day: 'Thu', workout: 'Easy Run 3mi', completed: true },
                        { day: 'Fri', workout: 'Rest', completed: true },
                        { day: 'Sat', workout: 'Long Run 5mi', completed: true, notes: 'Beautiful weather' },
                        { day: 'Sun', workout: 'Rest', completed: true }
                    ]
                },
                {
                    week: 2, days: [
                        { day: 'Mon', workout: 'Easy Run 3mi', completed: true },
                        { day: 'Tue', workout: 'Easy Run 3mi', completed: true },
                        { day: 'Wed', workout: 'Easy Run 3mi', completed: true },
                        { day: 'Thu', workout: 'Rest', completed: true },
                        { day: 'Fri', workout: 'Easy Run 4mi', completed: true },
                        { day: 'Sat', workout: 'Long Run 6mi', completed: true },
                        { day: 'Sun', workout: 'Rest', completed: true }
                    ]
                },
                {
                    week: 3, days: [
                        { day: 'Mon', workout: 'Easy Run 3mi', completed: true },
                        { day: 'Tue', workout: 'Easy Run 4mi', completed: true },
                        { day: 'Wed', workout: 'Easy Run 3mi', completed: true },
                        { day: 'Thu', workout: 'Easy Run 4mi', completed: true },
                        { day: 'Fri', workout: 'Rest', completed: true },
                        { day: 'Sat', workout: 'Long Run 7mi', completed: true },
                        { day: 'Sun', workout: 'Rest', completed: true }
                    ]
                }
            ],
            current: {
                week: 4, days: [
                    { day: 'Mon', workout: 'Easy Run 3mi', completed: true },
                    { day: 'Tue', workout: 'Easy Run 3mi', completed: true },
                    { day: 'Wed', workout: 'Easy Run 5mi', completed: false, current: true },
                    { day: 'Thu', workout: 'Rest', completed: false },
                    { day: 'Fri', workout: 'Cross Train 30min', completed: false },
                    { day: 'Sat', workout: 'Long Run 8mi', completed: false },
                    { day: 'Sun', workout: 'Rest', completed: false }
                ]
            },
            upcoming: [
                {
                    week: 5, days: [
                        { day: 'Mon', workout: 'Easy Run 3mi' },
                        { day: 'Tue', workout: 'Easy Run 4mi' },
                        { day: 'Wed', workout: 'Easy Run 5mi' },
                        { day: 'Thu', workout: 'Easy Run 3mi' },
                        { day: 'Fri', workout: 'Rest' },
                        { day: 'Sat', workout: 'Long Run 9mi' },
                        { day: 'Sun', workout: 'Rest' }
                    ]
                },
                {
                    week: 6, days: [
                        { day: 'Mon', workout: 'Easy Run 3mi' },
                        { day: 'Tue', workout: 'Easy Run 5mi' },
                        { day: 'Wed', workout: 'Tempo 4mi' },
                        { day: 'Thu', workout: 'Easy Run 3mi' },
                        { day: 'Fri', workout: 'Rest' },
                        { day: 'Sat', workout: 'Long Run 10mi' },
                        { day: 'Sun', workout: 'Rest' }
                    ]
                }
            ]
        },
        strength: {
            previous: [
                {
                    week: 1, days: [
                        { day: 'Mon', workout: 'Lower Power', completed: true, notes: 'Squats felt strong' },
                        { day: 'Tue', workout: 'Rest', completed: true },
                        { day: 'Wed', workout: 'Upper Power', completed: true },
                        { day: 'Thu', workout: 'Rest', completed: true },
                        { day: 'Fri', workout: 'Lower Hypertrophy', completed: true },
                        { day: 'Sat', workout: 'Upper Hypertrophy', completed: true },
                        { day: 'Sun', workout: 'Active Recovery', completed: true }
                    ]
                }
            ],
            current: {
                week: 2, days: [
                    { day: 'Mon', workout: 'Lower Power', completed: true },
                    { day: 'Tue', workout: 'Rest', completed: true },
                    { day: 'Wed', workout: 'Upper Power', completed: false, current: true },
                    { day: 'Thu', workout: 'Rest', completed: false },
                    { day: 'Fri', workout: 'Lower Hypertrophy', completed: false },
                    { day: 'Sat', workout: 'Upper Hypertrophy', completed: false },
                    { day: 'Sun', workout: 'Active Recovery', completed: false }
                ]
            },
            upcoming: [
                {
                    week: 3, days: [
                        { day: 'Mon', workout: 'Lower Power' },
                        { day: 'Tue', workout: 'Rest' },
                        { day: 'Wed', workout: 'Upper Power' },
                        { day: 'Thu', workout: 'Rest' },
                        { day: 'Fri', workout: 'Lower Hypertrophy' },
                        { day: 'Sat', workout: 'Upper Hypertrophy' },
                        { day: 'Sun', workout: 'Active Recovery' }
                    ]
                },
                {
                    week: 4, days: [
                        { day: 'Mon', workout: 'Lower Power (Deload)' },
                        { day: 'Tue', workout: 'Rest' },
                        { day: 'Wed', workout: 'Upper Power (Deload)' },
                        { day: 'Thu', workout: 'Rest' },
                        { day: 'Fri', workout: 'Lower Hypertrophy (Deload)' },
                        { day: 'Sat', workout: 'Upper Hypertrophy (Deload)' },
                        { day: 'Sun', workout: 'Rest' }
                    ]
                }
            ]
        }
    };

    const CalendarDialog = () => {
        const currentProgram = programWeeks[planType];
        const [localCalendarView, setLocalCalendarView] = useState('current');

        return (
            <Dialog onOpenChange={(open) => { if (open) setLocalCalendarView('current'); }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 w-full">
                        <Calendar className="h-4 w-4" />
                        View Program Calendar
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-2xl">Training Program Calendar</DialogTitle>
                        <DialogDescription>
                            View past workouts, current week, and upcoming training schedule
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 pr-2">
                        <Tabs value={localCalendarView} onValueChange={setLocalCalendarView} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-background z-10">
                                <TabsTrigger value="previous">Previous Weeks</TabsTrigger>
                                <TabsTrigger value="current">Current Week</TabsTrigger>
                                <TabsTrigger value="upcoming">Upcoming Weeks</TabsTrigger>
                            </TabsList>

                            <TabsContent value="previous" className="space-y-4 mt-4">
                                {currentProgram.previous.map((weekData) => (
                                    <Card key={weekData.week}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">Week {weekData.week}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {weekData.days.map((day, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-semibold w-12 text-muted-foreground">{day.day}</span>
                                                            <div>
                                                                <span className="text-sm font-medium">{day.workout}</span>
                                                                {day.notes && (
                                                                    <p className="text-xs text-muted-foreground mt-1">{day.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {day.completed && (
                                                            <span className="text-green-600 text-lg">✅</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            <TabsContent value="current" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Week {currentProgram.current.week} (Current)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {currentProgram.current.days.map((day, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center justify-between p-3 rounded-lg border ${day.current
                                                            ? 'bg-primary/10 border-primary'
                                                            : day.completed
                                                                ? 'bg-muted/50 border-border'
                                                                : 'bg-background border-border'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-sm font-semibold w-12 ${day.current ? 'text-primary' : 'text-muted-foreground'}`}>
                                                            {day.day}
                                                        </span>
                                                        <span className="text-sm font-medium">{day.workout}</span>
                                                        {day.current && (
                                                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-semibold">
                                                                TODAY
                                                            </span>
                                                        )}
                                                    </div>
                                                    {day.completed && (
                                                        <span className="text-green-600 text-lg">✅</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="upcoming" className="space-y-4 mt-4">
                                {currentProgram.upcoming.map((weekData) => (
                                    <Card key={weekData.week}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">Week {weekData.week}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {weekData.days.map((day, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-semibold w-12 text-muted-foreground">{day.day}</span>
                                                            <span className="text-sm">{day.workout}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Scheduled</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    // Dynamic content based on plan type
    const planData = {
        running: {
            planName: 'Marathon Novice 1',
            weekInfo: 'Week 4 / Day 3',
            todayWorkout: {
                emoji: '🏃',
                title: 'Easy Run 5mi',
                description: 'Aerobic base run to build endurance',
                metrics: [
                    { label: 'Distance', value: '5 mi' },
                    { label: 'Pace', value: 'Easy' },
                    { label: 'Duration', value: '45 min' }
                ]
            },
            stats: [
                { emoji: '🏃', label: 'Total Miles', value: '128', subtext: 'this month' },
                { emoji: '🔥', label: 'Current Streak', value: '14 days', subtext: 'keep it up!' },
                { emoji: '⏱️', label: 'Avg Pace', value: '8:12', subtext: 'per mile' }
            ],
            weekOverview: [
                { day: 'Mon', workout: 'Easy 3mi', status: '✅', color: 'text-green-600' },
                { day: 'Tue', workout: 'Easy 3mi', status: '✅', color: 'text-green-600' },
                { day: 'Wed', workout: 'Easy 5mi', status: '🔴', color: 'text-primary' },
                { day: 'Thu', workout: 'Rest', status: '⏳', color: 'text-muted-foreground' },
                { day: 'Fri', workout: 'Cross Train', status: '🟡', color: 'text-muted-foreground' },
                { day: 'Sat', workout: 'Long 8mi', status: '⏳', color: 'text-muted-foreground' },
                { day: 'Sun', workout: 'Rest', status: '⏳', color: 'text-muted-foreground' }
            ],
            weeklyProgress: [
                { week: 'Week 1', value: 12, max: 20, label: 'mi' },
                { week: 'Week 2', value: 15, max: 20, label: 'mi' },
                { week: 'Week 3', value: 18, max: 20, label: 'mi' },
                { week: 'Week 4', value: 11, max: 20, label: 'mi' }
            ],
            goals: [
                { label: 'Marathon Ready', value: 28, subtext: 'Week 4 of 16' },
                { label: 'Monthly Distance', value: 64, subtext: '128 / 200 miles' }
            ]
        },
        strength: {
            planName: 'Upper/Lower Split',
            weekInfo: 'Week 2 / Day 3',
            todayWorkout: {
                emoji: '💪',
                title: 'Upper Body Power',
                description: 'Compound movements focused on strength',
                metrics: [
                    { label: 'Exercises', value: '6' },
                    { label: 'Sets', value: '18 total' },
                    { label: 'Duration', value: '60 min' }
                ]
            },
            stats: [
                { emoji: '💪', label: 'Total Volume', value: '42,500 lbs', subtext: 'this month' },
                { emoji: '🔥', label: 'Current Streak', value: '14 days', subtext: 'keep it up!' },
                { emoji: '📈', label: 'PRs This Month', value: '8', subtext: 'personal records' }
            ],
            weekOverview: [
                { day: 'Mon', workout: 'Lower Power', status: '✅', color: 'text-green-600' },
                { day: 'Tue', workout: 'Rest', status: '✅', color: 'text-green-600' },
                { day: 'Wed', workout: 'Upper Power', status: '🔴', color: 'text-primary' },
                { day: 'Thu', workout: 'Rest', status: '⏳', color: 'text-muted-foreground' },
                { day: 'Fri', workout: 'Lower Hyper', status: '🟡', color: 'text-muted-foreground' },
                { day: 'Sat', workout: 'Upper Hyper', status: '⏳', color: 'text-muted-foreground' },
                { day: 'Sun', workout: 'Active Rec', status: '⏳', color: 'text-muted-foreground' }
            ],
            weeklyProgress: [
                { week: 'Week 1', value: 38000, max: 50000, label: 'lbs' },
                { week: 'Week 2', value: 42000, max: 50000, label: 'lbs' },
                { week: 'Week 3', value: 45000, max: 50000, label: 'lbs' },
                { week: 'Week 4', value: 18000, max: 50000, label: 'lbs' }
            ],
            goals: [
                { label: 'Strength Program', value: 37, subtext: 'Week 2 of 8' },
                { label: 'Monthly Volume', value: 85, subtext: '42.5k / 50k lbs' }
            ]
        }
    };

    const currentPlan = planData[planType];

    // Performance Dashboard
    const PerformanceLayout = () => (
        <div className="min-h-screen bg-background">

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-foreground">
                                {currentPlan.todayWorkout.emoji} Today's Workout
                            </h2>
                            <p className="text-muted-foreground">Wednesday, October 12, 2025</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Viewing:</span>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger className="w-[250px]">
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currentUser?.trainingPlans?.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.emoji} {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-foreground mb-2">{currentPlan.todayWorkout.emoji} Today's Workout</h2>
                        <p className="text-muted-foreground">Wednesday, October 12, 2025</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardDescription className="mb-1">{currentPlan.planName} — {currentPlan.weekInfo}</CardDescription>
                                    <CardTitle className="text-2xl">{currentPlan.todayWorkout.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">{currentPlan.todayWorkout.description}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                {currentPlan.todayWorkout.metrics.map((metric, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-muted">
                                        <div className="text-2xl font-bold text-primary">{metric.value}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button className="flex-1" size="lg">Log Results</Button>
                                <div className="flex-1"><CalendarDialog /></div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-3">
                        {currentPlan.stats.map((stat, i) => (
                            <Card key={i}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                            <h3 className="text-3xl font-bold text-primary mt-1">{stat.value}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-2xl">{stat.emoji}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">📈 Weekly {planType === 'running' ? 'Mileage' : 'Volume'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {currentPlan.weeklyProgress.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-muted-foreground">{item.week}</span>
                                                <span className="font-semibold">
                                                    {planType === 'running' ? item.value : (item.value / 1000).toFixed(1) + 'k'} {item.label}
                                                </span>
                                            </div>
                                            <Progress value={(item.value / item.max) * 100} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">🎯 Goal Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {currentPlan.goals.map((goal, i) => (
                                        <React.Fragment key={i}>
                                            {i > 0 && <Separator />}
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm text-muted-foreground">{goal.label}</span>
                                                    <span className="text-sm font-semibold">{goal.value}%</span>
                                                </div>
                                                <Progress value={goal.value} className="h-3" />
                                                <p className="text-xs text-muted-foreground mt-1">{goal.subtext}</p>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100">
            <PerformanceLayout />
        </div>
    );
}