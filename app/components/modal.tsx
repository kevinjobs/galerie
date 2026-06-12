"use client";

import { Rocket } from "@gravity-ui/icons";
import { Button, Modal, ModalContainerProps } from "@heroui/react";
import { isMobile } from "react-device-detect";

export default function Default({
  title,
  children,
  isOpen,
  onChangeAction,
  size = "cover",
}: {
  title?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onChangeAction: (isOpen: boolean) => void;
  size?: ModalContainerProps["size"];
}) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onChangeAction} variant="blur" className="bg-background/25 max-w-screen">
        <Modal.Container size={size} className="border border-border">
          <Modal.Dialog className="bg-black">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            <Modal.Footer></Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
