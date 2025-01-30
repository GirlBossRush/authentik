import React from "react";
import { coerce } from "semver";

export interface AuthentikVersionProps {
    semver: string;
}

/**
 * Badge indicating semantic versioning of authentik required for a feature or integration.
 */
export const VersionBadge: React.FC<AuthentikVersionProps> = ({ semver }) => {
    const parsed = coerce(semver);

    if (!parsed) {
        throw new Error(`Invalid semver version: ${semver}`);
    }

    return (
        <span className="badge badge--version">
            authentik:&nbsp;{parsed.format()}+
        </span>
    );
};

export default VersionBadge;
