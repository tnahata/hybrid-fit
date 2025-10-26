"use client";

import { useState, useMemo, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, Calendar, Target, TrendingUp, Route } from "lucide-react";
import { TrainingPlanDrawer } from "@/components/drawer/TrainingPlanDrawer";
import { TrainingPlanWithWorkouts, TrainingPlanDetailResponse } from "@/types/training-plan";
import { TrainingPlanDoc } from "@/models/TrainingPlans";
import { toast } from 'sonner';

export default function TrainingPlansPage() {
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState("name");
	const [level, setLevel] = useState("all");
	const [sport, setSport] = useState("all");
	const [category, setCategory] = useState("all");
	const [trainingPlans, setTrainingPlans] = useState<TrainingPlanDoc[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedPlan, setSelectedPlan] = useState<TrainingPlanWithWorkouts | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	const perPage = 9;

	const { data: session, status } = useSession();
	const [enrollingPlanId, setEnrollingPlanId] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		const fetchTrainingPlans = async () => {
			const response = await fetch("/api/training-plans", {
				method: "GET",
			});
			if (response?.ok) {
				const data = await response.json();
				setTrainingPlans(data.data);
			}
		};
		fetchTrainingPlans();
	}, []);

	const filtered = useMemo(() => {
		let list = trainingPlans;

		if (search)
			list = list.filter(
				(plan) =>
					plan.name.toLowerCase().includes(search.toLowerCase()) ||
					plan.details.goal.toLowerCase().includes(search.toLowerCase()) ||
					plan.category.toLowerCase().includes(search.toLowerCase())
			);

		if (level !== "all") {
			list = list.filter((plan) => plan.level.toLowerCase() === level.toLowerCase());
		}

		if (sport !== "all") {
			list = list.filter((plan) => plan.sport.toLowerCase() === sport.toLowerCase());
		}

		if (category !== "all") {
			list = list.filter((plan) => plan.category.toLowerCase() === category.toLowerCase());
		}

		list = [...list].sort((a, b) => {
			if (sort === "name") return a.name.localeCompare(b.name);
			if (sort === "duration") return a.durationWeeks - b.durationWeeks;
			if (sort === "level") return a.level.localeCompare(b.level);
			return 0;
		});

		return list;
	}, [trainingPlans, search, level, sport, category, sort]);

	const totalPages = Math.ceil(filtered.length / perPage);
	const paginatedPlans = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

	const handlePageChange = (page: number) => {
		if (page === 0 || page === totalPages + 1) {
			return;
		}
		setCurrentPage(page);
	};

	const handleCardClick = async (plan: TrainingPlanDoc) => {
		setIsLoadingDetail(true);
		try {
			const response = await fetch(`/api/training-plans/${plan._id}`);
			if (response.ok) {
				const detailResponse: TrainingPlanDetailResponse = await response.json();
				setSelectedPlan(detailResponse.data);
				setIsDrawerOpen(true);
			}
		} catch (error) {
			console.error("Error fetching training plan details:", error);
		} finally {
			setIsLoadingDetail(false);
		}
	};

	const handleEnroll = async (planId: string, planName: string, e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation();
		}

		if (status === "unauthenticated") {
			localStorage.setItem("pendingEnrollment", planId);

			toast.info("Please sign in to enroll", {
				description: "We'll enroll you in this plan after you sign in",
			});

			router.push("/signin");
			return;
		}

		if (status === "authenticated") {
			setEnrollingPlanId(planId);

			try {
				const response = await fetch("/api/users/me/enroll", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ planId }),
				});

				const data = await response.json();

				if (!response.ok) {
					if (response.status === 409) {
						toast.warning("Already enrolled", {
							description: "You are already enrolled in this plan",
						});
					} else {
						toast.error("Enrollment failed", {
							description: data.error || "Something went wrong",
						});
					}
					return;
				}

				console.log("I should be enrolled in plan ", planId);

				toast.success("Enrolled successfully!", {
					description: `You're now enrolled in ${planName}`,
				});

				router.push("/dashboard");
				router.refresh();
			} catch (error) {
				console.error("Enrollment error:", error);
				toast.error("Something went wrong", {
					description: "Please try again",
				});
			} finally {
				setEnrollingPlanId(null);
			}
		}
	};

	const getLevelColor = (level: string) => {
		switch (level.toLowerCase()) {
			case "beginner":
				return "bg-green-100 text-green-800 border-green-200";
			case "novice":
				return "bg-green-100 text-green-800 border-green-200";
			case "intermediate":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "advanced":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const renderPageNumbers = () => {
		const items: ReactNode[] = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				items.push(
					<PaginationItem key={i}>
						<PaginationLink
							isActive={currentPage === i}
							onClick={() => setCurrentPage(i)}
							className={currentPage === i ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
						>
							{i}
						</PaginationLink>
					</PaginationItem>
				);
			}
		} else {
			items.push(
				<PaginationItem key={1}>
					<PaginationLink
						isActive={currentPage === 1}
						onClick={() => setCurrentPage(1)}
						className={currentPage === 1 ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
					>
						1
					</PaginationLink>
				</PaginationItem>
			);

			if (currentPage > 3) {
				items.push(
					<PaginationItem key="ellipsis-start">
						<PaginationEllipsis />
					</PaginationItem>
				);
			}

			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			for (let i = start; i <= end; i++) {
				items.push(
					<PaginationItem key={i}>
						<PaginationLink
							isActive={currentPage === i}
							onClick={() => setCurrentPage(i)}
							className={currentPage === i ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
						>
							{i}
						</PaginationLink>
					</PaginationItem>
				);
			}

			if (currentPage < totalPages - 2) {
				items.push(
					<PaginationItem key="ellipsis-end">
						<PaginationEllipsis />
					</PaginationItem>
				);
			}

			items.push(
				<PaginationItem key={totalPages}>
					<PaginationLink
						onClick={() => setCurrentPage(totalPages)}
						className={currentPage === totalPages ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
						isActive={currentPage === totalPages}
					>
						{totalPages}
					</PaginationLink>
				</PaginationItem>
			);
		}

		return items;
	};

	return (
		<div className="container mx-auto px-6 py-10 space-y-6">

			<div className="space-y-2">
				<h1 className="text-3xl font-bold">Training Plans</h1>
				<p className="text-muted-foreground">
					Discover structured training programs designed to help you reach your goals
				</p>
			</div>

			<div className="flex flex-col md:flex-row items-center justify-between gap-4">
				<div className="relative w-full md:w-1/3">
					<Search className="absolute left-3 top-3 text-gray-400" size={18} />
					<Input
						placeholder="Search training plans..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setCurrentPage(1);
						}}
						className="pl-9"
					/>
				</div>

				<div className="flex flex-wrap gap-3 items-center justify-end">
					<Select value={sport} onValueChange={setSport}>
						<SelectTrigger className="w-[160px]">
							<SelectValue placeholder="Sport" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Sports</SelectItem>
							<SelectItem value="running">Running</SelectItem>
							<SelectItem value="strength training">Strength Training</SelectItem>
							<SelectItem value="soccer">Soccer</SelectItem>
							<SelectItem value="hybrid">Hybrid</SelectItem>
						</SelectContent>
					</Select>

					<Select value={category} onValueChange={setCategory}>
						<SelectTrigger className="w-[160px]">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							<SelectItem value="endurance">Endurance</SelectItem>
							<SelectItem value="strength">Strength</SelectItem>
							<SelectItem value="speed">Speed</SelectItem>
							<SelectItem value="hybrid">Hybrid</SelectItem>
						</SelectContent>
					</Select>

					<Select value={level} onValueChange={setLevel}>
						<SelectTrigger className="w-[160px]">
							<SelectValue placeholder="Level" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Levels</SelectItem>
							<SelectItem value="beginner">Beginner</SelectItem>
							<SelectItem value="intermediate">Intermediate</SelectItem>
							<SelectItem value="advanced">Advanced</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						onClick={() => {
							const nextSort = sort === "name" ? "duration" : sort === "duration" ? "level" : "name";
							setSort(nextSort);
						}}
					>
						<ArrowUpDown size={16} className="mr-2" />
						Sort by {sort === "name" ? "Name" : sort === "duration" ? "Duration" : "Level"}
					</Button>
				</div>
			</div>

			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{paginatedPlans.map((plan) => (
					<Card
						key={plan._id}
						className="shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
						onClick={() => handleCardClick(plan)}
					>
						<CardContent className="p-6 space-y-4">
							<div className="flex justify-between items-start">
								<Badge className={`${getLevelColor(plan.level)} border`}>
									{plan.level}
								</Badge>
								<Badge variant="outline" className="text-xs">
									{plan.sport}
								</Badge>
							</div>

							<div className="space-y-2">
								<h2 className="text-xl font-bold group-hover:text-orange-500 transition-colors">
									{plan.name}
								</h2>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{plan.details.goal}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-3 pt-2">
								<div className="flex items-center gap-2 text-sm">
									<Calendar className="h-4 w-4 text-orange-500" />
									<span className="text-muted-foreground">
										{plan.durationWeeks} weeks
									</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Target className="h-4 w-4 text-orange-500" />
									<span className="text-muted-foreground capitalize">
										{plan.category}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-2 pt-2 border-t">
								<TrendingUp className="h-4 w-4 text-orange-500" />
								<span className="text-sm font-medium capitalize">
									{plan.details.planType}
								</span>
							</div>

							<div className="flex gap-2 w-full">
								<Button
									variant="default"
									className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
									onClick={(e) => handleEnroll(plan._id, plan.name, e)}
									disabled={enrollingPlanId === plan._id || status === "loading"}
								>
									{status === "authenticated" && enrollingPlanId === plan._id ? "Enrolling..." : "Enroll"}
								</Button>
								<Button
									variant="outline"
									className="flex-1"
									disabled={isLoadingDetail}
								>
									{isLoadingDetail ? "Loading..." : "View Details"}
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{paginatedPlans.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">No training plans found matching your criteria.</p>
				</div>
			)}

			{totalPages > 1 && (
				<Pagination>
					<PaginationContent>
						<PaginationPrevious onClick={() => handlePageChange(currentPage - 1)}>
							Previous
						</PaginationPrevious>
						{renderPageNumbers()}
						<PaginationNext onClick={() => handlePageChange(currentPage + 1)}>
							Next
						</PaginationNext>
					</PaginationContent>
				</Pagination>
			)}

			<TrainingPlanDrawer
				plan={selectedPlan}
				open={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
			/>
		</div>
	);
}