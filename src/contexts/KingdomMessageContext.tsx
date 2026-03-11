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
	remainingTime: number;
}

const KingdomMessageContext = createContext<MessageContextType | undefined>(
	undefined,
);

const MESSAGE_DURATION = 3000;

export function KingdomMessageProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState<string | null>(null);
	const [messageType, setMessageType] = useState<MessageType>(null);
	const [remainingTime, setRemainingTime] = useState<number>(0);
	const location = useLocation();

	const clearMessage = useCallback(() => {
		setMessage(null);
		setMessageType(null);
		setRemainingTime(0);
	}, []);

	const showMessage = (msg: string, type: MessageType) => {
		setMessage(msg);
		setMessageType(type);
		setRemainingTime(MESSAGE_DURATION);
	};

	// Clear on navigation
	useEffect(() => {
		if (location) {
			clearMessage();
		}
	}, [clearMessage, location]);

	// Countdown timer
	useEffect(() => {
		if (message && remainingTime > 0) {
			const interval = setInterval(() => {
				setRemainingTime((prev) => {
					if (prev <= 100) {
						clearMessage();
						return 0;
					}
					return prev - 100;
				});
			}, 100);
			return () => clearInterval(interval);
		}
	}, [message, remainingTime, clearMessage]);

	return (
		<KingdomMessageContext.Provider
			value={{ message, messageType, showMessage, clearMessage, remainingTime }}
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
