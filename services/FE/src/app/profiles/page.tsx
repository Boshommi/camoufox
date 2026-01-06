"use client";

import { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import { DETECTOR_VERSION } from "~/lib/fingerprint-detector";
import { toPythonDict, toJSON } from "~/lib/config-formatter";

export default function ProfilesPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<"python" | "json">("python");
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

  const { data: profiles, isLoading, refetch } = api.profile.list.useQuery();

  const deleteProfile = api.profile.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteAll = api.profile.deleteAll.useMutation({
    onSuccess: () => refetch(),
  });

  const getProfileConfig = api.profile.getConfig.useQuery(
    { name: expandedProfile || "" },
    { enabled: !!expandedProfile }
  );

  const utils = api.useUtils();

  const copyConfig = useCallback(
    async (profileName: string) => {
      const configData = await utils.profile.getConfig.fetch({
        name: profileName,
      });

      if (!configData) return;

      const output =
        outputFormat === "python"
          ? toPythonDict(configData.config, { includeComments: true })
          : toJSON(configData.config, true);

      try {
        await navigator.clipboard.writeText(output);
        setCopied(profileName);
        setTimeout(() => setCopied(null), 2000);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = output;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(profileName);
        setTimeout(() => setCopied(null), 2000);
      }
    },
    [outputFormat, utils]
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Saved Profiles</h1>
            <p className="text-gray-400">
              Manage saved fingerprint profiles
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Format:</span>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as "python" | "json")}
                className="bg-gray-700 rounded px-2 py-1 text-sm"
              >
                <option value="python">Python dict</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
            >
              Refresh
            </button>
            {profiles && profiles.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Delete ALL profiles? This cannot be undone.")) {
                    deleteAll.mutate();
                  }
                }}
                disabled={deleteAll.isPending}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50"
              >
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Current Detector Version: <strong className="text-gray-200">v{DETECTOR_VERSION}</strong>
          </span>
          <span className="text-xs text-gray-500">
            Profiles with older versions may need re-capture
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : !profiles?.length ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">No Profiles Yet</h2>
            <p className="text-gray-400 mb-4">
              Go to the Capture page to create your first profile
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Capture Profile
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-gray-800 rounded-lg overflow-hidden"
              >
                {/* Profile Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold font-mono">
                        {profile.name}
                      </h3>
                      {profile.isOutdated && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                          title={`This profile was created with detector v${profile.detectorVersion}. Current version is v${profile.currentDetectorVersion}. Re-capture recommended.`}
                        >
                          Outdated (v{profile.detectorVersion})
                        </span>
                      )}
                      {!profile.isOutdated && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-600/20 text-green-400 border border-green-600/30">
                          v{profile.detectorVersion}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyConfig(profile.name)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          copied === profile.name
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {copied === profile.name ? "Copied!" : "Copy Config"}
                      </button>
                      <button
                        onClick={() =>
                          setExpandedProfile(
                            expandedProfile === profile.name ? null : profile.name
                          )
                        }
                        className="px-3 py-1.5 rounded text-sm bg-gray-700 hover:bg-gray-600"
                      >
                        {expandedProfile === profile.name ? "Hide" : "View"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete profile "${profile.name}"?`)) {
                            deleteProfile.mutate({ name: profile.name });
                          }
                        }}
                        disabled={deleteProfile.isPending}
                        className="px-3 py-1.5 rounded text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Browser:</span>
                      <span className="text-gray-300">{profile.browser}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Screen:</span>
                      <span className="text-gray-300">
                        {profile.screenWidth}x{profile.screenHeight}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Canvas:</span>
                      <span className="text-gray-300">
                        {profile.canvasCount} fingerprints
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Updated:</span>
                      <span className="text-gray-300">
                        {formatDate(profile.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Config View */}
                {expandedProfile === profile.name && (
                  <div className="p-4 bg-gray-900">
                    {getProfileConfig.isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : getProfileConfig.data ? (
                      <pre className="text-xs font-mono text-gray-300 overflow-auto max-h-96">
                        {outputFormat === "python"
                          ? toPythonDict(getProfileConfig.data.config, {
                              includeComments: true,
                            })
                          : toJSON(getProfileConfig.data.config, true)}
                      </pre>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Failed to load config
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
