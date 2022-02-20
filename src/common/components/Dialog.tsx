import React, { ReactNode } from "react";
import "./Dialog.less";
import { Button } from "./Button";
import { EventOverloadMethod } from "../utils/misc";

import { Dialog as BPDialog } from "@blueprintjs/core";

interface ModalProps {
	size: "small" | "large";
	variant?: "regular" | "danger";
	title?: string | JSX.Element;
	confirmButtonText?: string;
	onConfirm?: EventOverloadMethod;
	onCancel?: () => void;
	onClose?: () => void;
	children?: ReactNode;
	noFooter?: boolean;
}

export function Dialog({
	size,
	title,
	variant,
	confirmButtonText,
	onConfirm,
	onCancel,
	children,
	onClose,
	noFooter = false,
}: ModalProps): JSX.Element {
	const rootElement = document.getElementById("root");

	return rootElement ? (
		<BPDialog
			className="modal"
			isOpen
			usePortal
			lazy
			portalContainer={rootElement}
			onClose={onCancel}
			onClosed={onClose}
			title={<span className={"title"}>{title}</span>}
		>
			<div className="content">{children}</div>
			{noFooter ? (
				<></>
			) : (
				<div className={"footer"}>
					{onCancel && (
						<div>
							<Button variant={"primary"} text={"Cancel"} onClick={onCancel} />
						</div>
					)}
					{onConfirm && (
						<div>
							<Button
								variant={variant === "danger" ? "danger" : "success"}
								text={confirmButtonText || "Confirm"}
								onClick={onConfirm}
							/>
						</div>
					)}
				</div>
			)}
		</BPDialog>
	) : (
		<></>
	);
}
