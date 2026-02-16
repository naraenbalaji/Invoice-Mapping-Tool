import { Typography } from "@mui/material";
import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// Sample data
const data = [
    { name: "A", Count: 4000 },
    { name: "B", Count: 3000 },
    { name: "C", Count: 5000 },
    { name: "D", Count: 2000 },
    { name: "E", Count: 3500 },
];

export default function VerticalBarChart({data}) {
    return (
        <div>
            <Typography
                component="h3"
                color="#1976d2"
                sx={{ width: "max-content", fontWeight: 600, mb: 2 }}
            >
                Comparison of Vendors and Invoices Processed
            </Typography>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center", // centers horizontally
                    justifyContent: "center",
                    width: "100%",
                    // padding: "2rem 0",
                }}
            >
                <div style={{ width: "100%", maxWidth: "600px", minWidth: "300px" }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="vendor_name" axisLine={false} tickLine={false}  interval={0} />
                            <Tooltip />
                            <Bar
                                dataKey="count"
                                fill="#1976d2"
                                label={{
                                    position: "top",
                                    style: { fill: "#1976d2", fontWeight: "bold", fontSize: 14 },
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
