import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function usePendingEnrollment() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);
	const hasProcessed = useRef(false);

	useEffect(() => {
		const processEnrollment = async () => {
			if (status !== "authenticated" || hasProcessed.current) {
				return;
			}

			hasProcessed.current = true;

			const pendingPlanId = localStorage.getItem("pendingEnrollment");

			if (!pendingPlanId) {
				return;
			}

			setIsProcessingEnrollment(true);

			try {
				const enrollResponse = await fetch("/api/users/me/enroll", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ planId: pendingPlanId }),
				});

				const enrollData = await enrollResponse.json();

				localStorage.removeItem("pendingEnrollment");

				if (enrollResponse.ok) {
					toast.success("Enrolled successfully!", {
						description: `You've been enrolled in ${enrollData.plan.name}`,
					});
					router.push("/dashboard");
				} else {
					toast.error("Enrollment failed", {
						description: enrollData.error,
					});
					router.push("/training-plans");
				}
			} catch (error) {
				localStorage.removeItem("pendingEnrollment");
				toast.error("Something went wrong", {
					description: "Please try enrolling again",
				});
				router.push("/training-plans");
			} finally {
				setIsProcessingEnrollment(false);
			}
		}

		processEnrollment();

	}, [status, router]);

	return { isProcessingEnrollment };
}