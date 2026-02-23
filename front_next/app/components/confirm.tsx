"use client";

import { AlertDialog, Button, ButtonProps } from "@heroui/react";

export default function Default({
  children,
  title,
  content = "",
  cancelText = "取消",
  confirmText = "确认",
  variant = "primary",
  onConfirmAction,
  onCancelAction,
}: {
  children: React.ReactNode;
  title: string;
  content?: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  variant?: ButtonProps["variant"];
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger>{children}</AlertDialog.Trigger>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>{title}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>{content}</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary" onPress={onCancelAction}>
                {cancelText}
              </Button>
              <Button slot="close" variant={variant} onPress={onConfirmAction}>
                {confirmText}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
