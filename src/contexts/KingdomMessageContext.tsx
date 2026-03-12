import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
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

	const clearMessage = useCallback(() => {
		setMessage(null);
		setMessageType(null);
		setRemainingTime(0);
	}, []);

	const showMessage = useCallback((msg: string, type: MessageType) => {
		setMessage(msg);
		setMessageType(type);
		setRemainingTime(MESSAGE_DURATION);
	}, []);

	const contextValue = useMemo(
		() => ({ message, messageType, showMessage, clearMessage, remainingTime }),
		[message, messageType, showMessage, clearMessage, remainingTime],
	);

	// Clear on navigation
	useEffect(() => {
		clearMessage();
	}, [clearMessage]);

	// Countdown timer
	useEffect(() => {
		if (message && remainingTime > 0) {
			const timeout = setTimeout(() => {
				clearMessage();
			}, remainingTime);
			return () => clearTimeout(timeout);
		}
	}, [message, remainingTime, clearMessage]);

	return (
		<KingdomMessageContext.Provider value={contextValue}>
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
