"use client";

import { useState, useMemo, useEffect, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown } from "lucide-react";
import { ExerciseDoc } from "@/models/Exercise"

export default function ExerciseContent() {

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("name");
    const [difficulty, setDifficulty] = useState("all");
    const [sport, setSport] = useState("all");
	const [exercises, setExercises] = useState<ExerciseDoc[]>([]);
	const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 12;

    useEffect(() => {
        const exercisesFetch = async() => {
			setIsLoading(true);
            const response = await fetch("/api/exercises", {
                method: 'GET'
            });
            if (response?.ok) {
                const ex = await response.json();
                setExercises(ex.data);
			}
			setIsLoading(false);
        }
        exercisesFetch();
    }, []);

    // Filtering and sorting logic
    const filtered = useMemo(() => {
        let list = exercises;

        if (search)
            list = list.filter(
                (ex) =>
                    ex.name.toLowerCase().includes(search.toLowerCase()) ||
                    ex.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
            );

        if (difficulty !== "all") {
            list = list.filter((ex) => ex.difficulty.toLowerCase() === difficulty.toLowerCase());
        }

        if (sport !== "all") {
            list = list.filter((ex) => ex.sport.toLowerCase() === sport.toLowerCase());
        }

        list = [...list].sort((a, b) => {
            if (sort === "name") return a.name.localeCompare(b.name);
            if (sort === "difficulty") return a.difficulty.localeCompare(b.difficulty);
            return 0;
        });

        return list;
    }, [exercises, search, difficulty, sport, sort]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginatedExercises = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handlePageChange = (page: number) => {
        if (page == 0 || page == totalPages + 1) {
            return;
        }
        setCurrentPage(page);
    };

    const renderPageNumbers = () => {
        const items: ReactNode[] = [];
		const maxVisiblePages = 5;
		const selectedPageClass = "bg-orange-500 text-white hover:bg-orange-600";

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => setCurrentPage(i)}
							className={currentPage === i ? selectedPageClass : ""}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>,
                );
            }
        } else {
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        isActive={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
						className={currentPage === 1 ? selectedPageClass : ""}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>,
            );

            if (currentPage > 3) {
                items.push(
                    <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                    </PaginationItem>,
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
							className={currentPage === i ? selectedPageClass : ""}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>,
                );
            }

            if (currentPage < totalPages - 2) {
                items.push(
                    <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                    </PaginationItem>,
                );
            }

            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
						className={currentPage === totalPages ? selectedPageClass : ""}
                        isActive={currentPage === totalPages}
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    return (
        <div className="container mx-auto px-6 py-10 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                        placeholder="Search exercises..."
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
                        </SelectContent>
                    </Select>

                    <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={() => setSort(sort === "name" ? "difficulty" : "name")}>
                        <ArrowUpDown size={16} />
                        Sort by {sort === "name" ? "Difficulty" : "Name"}
                    </Button>
                </div>
            </div>

			{isLoading ? (
				<div className="min-h-screen bg-background flex items-center justify-center">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
						<p className="text-muted-foreground">Loading exercises...</p>
					</div>
				</div>
			) :
			(
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{paginatedExercises.map((ex) => (
						<Card key={ex._id} className="shadow-sm hover:shadow-md transition-all duration-200">
							<CardContent className="p-5 space-y-3">
								<h2 className="text-xl font-semibold">{ex.name}</h2>
								<p className="text-sm text-gray-500 line-clamp-3">{ex.description}</p>
								<div className="flex flex-wrap gap-2">
									{ex.focus.slice(0, 3).map((f, idx) => (
										<Badge key={idx} variant="secondary">
											{f}
										</Badge>
									))}
								</div>
								<div className="flex justify-between items-center pt-2">
									<Badge variant="outline">{ex.difficulty}</Badge>
									<Button variant="link" asChild>
										<a href={ex.sourceUrl} target="_blank" rel="noopener noreferrer">
											View →
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{!isLoading && paginatedExercises.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">No exercises found matching your criteria.</p>
				</div>
			)}

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationPrevious
							onClick={() => handlePageChange(currentPage - 1)}>
							Previous
						</PaginationPrevious>
                            {renderPageNumbers()}
						<PaginationNext onClick={() => handlePageChange(currentPage + 1)}>
							Next
						</PaginationNext>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
