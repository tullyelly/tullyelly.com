"use client";

import * as React from "react";

type CloseHandler = () => void;

type NavControllerValue = {
  registerCloseHandler(handler: CloseHandler): () => void;
  closeAll(): void;
};

const NavControllerContext = React.createContext<NavControllerValue | null>(
  null,
);

export function NavControllerProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const handlersRef = React.useRef(new Set<CloseHandler>());

  const registerCloseHandler = React.useCallback((handler: CloseHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const closeAll = React.useCallback(() => {
    handlersRef.current.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("NavController close handler failed", error);
        }
      }
    });
  }, []);

  const value = React.useMemo<NavControllerValue>(
    () => ({
      registerCloseHandler,
      closeAll,
    }),
    [registerCloseHandler, closeAll],
  );

  return (
    <NavControllerContext.Provider value={value}>
      {children}
    </NavControllerContext.Provider>
  );
}

export function useNavController(): NavControllerValue {
  const context = React.useContext(NavControllerContext);
  if (!context) {
    throw new Error(
      "useNavController must be used within NavControllerProvider",
    );
  }
  return context;
}
