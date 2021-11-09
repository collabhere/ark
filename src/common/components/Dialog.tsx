import React, { ReactNode } from "react";
import { Modal } from "antd";
import "./Dialog.less";
import { Button } from "./Button";

interface ModalProps {
	size: "small" | "large";
	title?: string | JSX.Element;
	onConfirm?: () => void;
	onCancel?: () => void;
	onClose?: () => void;
	children?: ReactNode;
	noFooter?: boolean;
}

export function Dialog({
	size,
	title,
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
			onOk={onConfirm}
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
									variant={"secondary"}
									text={"Confirm"}
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
