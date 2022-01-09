import React, { ReactNode, useState } from "react";
import { Modal } from "antd";
import "./Dialog.less";
import { Button } from "./Button";
import { EventOverloadMethod } from "../utils/misc";

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
		<Modal
			title={<span className={"modal-title"}>{title}</span>}
			centered
			getContainer={rootElement}
			onCancel={onCancel}
			afterClose={onClose}
			visible={true}
			width={size === "small" ? 600 : 1000}
			footer={
				!noFooter && (
					<div className={"modal-footer"}>
						{onCancel && (
							<div>
								<Button
									variant={"primary"}
									text={"Cancel"}
									onClick={onCancel}
								/>
							</div>
						)}
						{onConfirm && (
							<div>
								<Button
									variant={variant === "danger" ? "danger" : "secondary"}
									text={confirmButtonText || "Confirm"}
									onClick={onConfirm}
								/>
							</div>
						)}
					</div>
				)
			}
		>
			<div>{children}</div>
		</Modal>
	) : (
		<></>
	);
}
