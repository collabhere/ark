import React, { FC } from "react";
import { Collapse } from "antd";
import { ObjectId } from "bson";
import "../../styles.less";
import "../../../../common/styles/layout.less";
import { CaretRightOutlined } from "@ant-design/icons";

const { Panel } = Collapse;

interface BSONTest {
	type:
		| "oid"
		| "isodate"
		| "number"
		| "string"
		| "boolean"
		| "subdocument"
		| "subdocument[]"
		| "unknown";
}

const testBsonValue = (value: Ark.BSONTypes): BSONTest => ({
	type:
		value instanceof ObjectId
			? "oid"
			: value instanceof Date
			? "isodate"
			: typeof value === "string"
			? "string"
			: typeof value === "number"
			? "number"
			: typeof value === "boolean"
			? "boolean"
			: typeof value === "object" && Array.isArray(value)
			? "subdocument[]"
			: typeof value === "object"
			? "subdocument"
			: "unknown",
});

interface JSONViewerProps {
	bson: Ark.BSONArray;
}

export const TreeViewer: FC<JSONViewerProps> = (props) => {
	const { bson } = props;

	const buildObjectIdRow = (key, value) => (
		<div style={{ display: "flex" }} key={key}>
			<div style={{ width: "50%" }}>{key}</div>
			<div style={{ width: "50%" }}>
				{`ObjectId("` + value.toString() + `")`}
			</div>
		</div>
	);

	const buildISODateRow = (key, value) => (
		<div style={{ display: "flex" }} key={key}>
			<div style={{ width: "50%" }}>{key}</div>
			<div style={{ width: "50%" }}>
				{`ISODate("` + value.toString() + `")`}
			</div>
		</div>
	);

	const buildPrimitiveValueRow = (key, value) => (
		<div style={{ display: "flex" }} key={key}>
			<div style={{ width: "50%" }}>{key}</div>
			<div style={{ width: "50%" }}>{String(value)}</div>
		</div>
	);

	const buildDocumentPanel = (key, document) => (
		<Panel
			header={
				key +
				(document._id ? ` ObjectId("` + document._id.toString() + `")` : "")
			}
			key={key}
		>
			{Object.entries(document).reduce(buildRow, [])}
		</Panel>
	);

	const buildRow = (state, [key, value]) => {
		const { type } = testBsonValue(value);
		switch (type) {
			case "subdocument[]": {
				const subdocumentArray = value as Ark.BSONArray;

				const documents: React.ReactNode[] = [];
				const primitives: React.ReactNode[] = [];

				subdocumentArray.forEach((document, index) => {
					const { type } = testBsonValue(document);
					if (type == "subdocument" || type == "subdocument[]")
						documents.push(buildDocumentPanel(index + 1, document));
					else primitives.push(buildPrimitiveValueRow(index, document));
				});
				state.push(
					<div>
						<div>{primitives}</div>
						<Collapse
							defaultActiveKey={["0"]}
							expandIcon={({ isActive }) => (
								<CaretRightOutlined rotate={isActive ? 90 : 0} />
							)}
						>
							<Panel key={key} header={key}>
								<Collapse
									defaultActiveKey={["0"]}
									expandIcon={({ isActive }) => (
										<CaretRightOutlined rotate={isActive ? 90 : 0} />
									)}
								>
									{documents}
								</Collapse>
							</Panel>
						</Collapse>
					</div>
				);
				break;
			}
			case "subdocument": {
				const document = value as Ark.BSONDocument;
				state.push(
					<Collapse
						defaultActiveKey={["0"]}
						expandIcon={({ isActive }) => (
							<CaretRightOutlined rotate={isActive ? 90 : 0} />
						)}
					>
						{buildDocumentPanel(key, document)}
					</Collapse>
				);
				break;
			}
			case "oid": {
				state.push(buildObjectIdRow(key, value));
				break;
			}
			case "isodate": {
				state.push(buildISODateRow(key, value));
				break;
			}
			case "boolean":
			case "number":
			case "string": {
				state.push(buildPrimitiveValueRow(key, value));
				break;
			}
			case "unknown":
			default:
				state.push(
					<div style={{ display: "flex" }} key={key}>
						<div style={{ width: "50%" }}>{key}</div>
						<div style={{ width: "50%" }}>{}</div>
					</div>
				);
		}

		return state;
	};

	return (
		<>
			{bson && bson.length ? (
				<div className="TreeViewer">
					<Collapse
						defaultActiveKey={["0"]}
						expandIcon={({ isActive }) => (
							<CaretRightOutlined rotate={isActive ? 90 : 0} />
						)}
					>
						{bson.map((document, index) =>
							buildDocumentPanel(index + 1, document)
						)}
					</Collapse>
				</div>
			) : (
				<div></div>
			)}
		</>
	);
};
