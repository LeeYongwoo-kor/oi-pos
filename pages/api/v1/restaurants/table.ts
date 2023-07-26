import { Method } from "@/constants/fetch";
import {
  createRestaurantTableAndAssignment,
  upsertTableTypeAssignments,
} from "@/database";
import withApiHandler from "@/lib/server/withApiHandler";
import { NextApiRequest, NextApiResponse } from "next";

export interface ISeatingConfig {
  tableNumber: number;
  counterNumber: number;
}
export interface IPostRestaurantTableBody {
  restaurantId: string;
  seatingConfig: ISeatingConfig;
}
export interface IPutRestaurantTableBody {
  restaurantTableId: string;
  tableType: TableType;
  number: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === Method.POST) {
    const { restaurantId, seatingConfig }: IPostRestaurantTableBody = req.body;
    const newTableType = await createRestaurantTableAndAssignment(
      restaurantId,
      seatingConfig
    );

    return res.status(201).json(newTableType);
  }
  if (req.method === Method.PUT) {
    const body: IPutRestaurantTableBody[] = req.body;
    const upsertTableType = await upsertTableTypeAssignments(body);

    return res.status(200).json(upsertTableType);
  }
}

export default withApiHandler({
  methods: ["POST", "PUT"],
  handler,
});
