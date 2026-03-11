import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

type MessageType = "success" | "error" | "warning" | null;

interface MessageContextType {
	message: string | null;
	messageType: MessageType;
	showMessage: (msg: string, type: MessageType) => void;
	clearMessage: () => void;
}

const KingdomMessageContext = createContext<MessageContextType | undefined>(
	undefined,
);

export function KingdomMessageProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState<string | null>(null);
	const [messageType, setMessageType] = useState<MessageType>(null);
	const location = useLocation();

	const clearMessage = useCallback(() => {
		setMessage(null);
		setMessageType(null);
	}, []);

	const showMessage = (msg: string, type: MessageType) => {
		setMessage(msg);
		setMessageType(type);
	};

	// Clear on navigation
	useEffect(() => {
		if (location) {
			clearMessage();
		}
	}, [clearMessage, location]);

	// Clear after 10 seconds
	useEffect(() => {
		if (message) {
			const timer = setTimeout(() => {
				clearMessage();
			}, 10000);
			return () => clearTimeout(timer);
		}
	}, [message, clearMessage]);

	return (
		<KingdomMessageContext.Provider
			value={{ message, messageType, showMessage, clearMessage }}
		>
			{children}
		</KingdomMessageContext.Provider>
	);
}

export function useKingdomMessage() {
	const context = useContext(KingdomMessageContext);
	if (context === undefined) {
		throw new Error(
			"useKingdomMessage must be used within a KingdomMessageProvider",
		);
	}
	return context;
}
