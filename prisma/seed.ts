import { PlanId } from "@/constants/plan";
import { upsertPlans } from "@/database";
import { CurrecyType, PlanType, PrismaClient } from "@prisma/client";
const seedPrisma = new PrismaClient();

async function main() {
  const plans = [
    {
      id: PlanId.TRIAL_PLAN,
      planType: PlanType.FREE_TRIAL,
      name: "Try riding YOSHI",
      description: "90-Day Free Trial",
      maxMenus: 30,
      maxTables: 10,
      price: 0,
      currency: CurrecyType.USD,
      duration: 7776000,
    },
    {
      id: PlanId.MONTHLY_PLAN,
      planType: PlanType.MONTHLY,
      name: "Have fun with YOSHI every month",
      description: "Monthly Paid",
      maxMenus: 500,
      maxTables: 200,
      price: 4.99,
      currency: CurrecyType.USD,
      duration: 2678400,
    },
    {
      id: PlanId.YEARLY_PLAN,
      planType: PlanType.YEARLY,
      name: "YOSHI is your friend every year!",
      description: "1 Year Paid",
      maxMenus: 500,
      maxTables: 200,
      price: 49.99,
      currency: CurrecyType.USD,
      duration: 31536000,
    },
  ];

  const createPlansResult = await upsertPlans(plans);
  // log result
  console.log(createPlansResult);
}

main()
  .catch((err) => {
    // send error to sentry
    console.log(err);
    process.exit(1);
  })
  .finally(() => seedPrisma.$disconnect());
