import React from "react";

interface UseRefresh {
	(): [number, () => void];
}

export const useRefresh: UseRefresh = () => {
	const [refToken, setToken] = React.useState(0);
	return [refToken, () => setToken(refToken + 1)];
};
