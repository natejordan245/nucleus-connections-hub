import type { IProfileStore, INotificationStore } from "@/contracts/data-layer";
import type { InterestSide, InterestState } from "@/contracts/data";

/**
 * Translates an interest vote into one or more notifications. Called by both
 * the in-process MockInterestService and the /api/interest route so emission
 * happens regardless of which path the vote takes.
 *
 * Emission rules:
 *   • Voter chose "interested" + recipient hadn't already → "interest_received"
 *   • Mutual just fired (mutualAt transitioned from null) → "mutual_match" to both sides
 *   • Voter chose "pass" → no notification (we don't gossip about rejections)
 */
export async function emitInterestNotifications(opts: {
  notificationStore: INotificationStore;
  profileStore: IProfileStore;
  talentId: string;
  startupId: string;
  from: InterestSide;
  voterState: "interested" | "pass";
  prior: InterestState;
  next: InterestState;
}): Promise<void> {
  const { notificationStore, profileStore, talentId, startupId, from, voterState, prior, next } = opts;

  if (voterState !== "interested") return;

  const [talent, startup] = await Promise.all([
    profileStore.getTalent(talentId),
    profileStore.getStartup(startupId),
  ]);
  if (!talent || !startup) return;

  const justWentMutual = !!next.mutualAt && !prior.mutualAt;

  // interest_received — voter expressed interest for the first time, but the
  // pair isn't mutual yet (the mutual event takes precedence).
  const voterPriorState = from === "talent" ? prior.talentState : prior.startupState;
  const voterFlippedToInterested = voterPriorState !== "interested";

  if (voterFlippedToInterested && !justWentMutual) {
    if (from === "talent") {
      await notificationStore.add({
        recipientId: startup.id,
        recipientType: "startup",
        kind: "interest_received",
        fromId: talent.id,
        fromName: talent.name,
        fromType: "talent",
        message: `${talent.name} expressed interest in ${startup.name}.`,
        href: `/handshake?as=${startup.id}&with=${talent.id}`,
      });
    } else {
      await notificationStore.add({
        recipientId: talent.id,
        recipientType: "talent",
        kind: "interest_received",
        fromId: startup.id,
        fromName: startup.name,
        fromType: "startup",
        message: `${startup.name} expressed interest in you.`,
        href: `/handshake?as=${talent.id}&with=${startup.id}`,
      });
    }
  }

  if (justWentMutual) {
    await notificationStore.add({
      recipientId: talent.id,
      recipientType: "talent",
      kind: "mutual_match",
      fromId: startup.id,
      fromName: startup.name,
      fromType: "startup",
      message: `Mutual match with ${startup.name}. Time to talk.`,
      href: `/handshake?as=${talent.id}&with=${startup.id}`,
    });
    await notificationStore.add({
      recipientId: startup.id,
      recipientType: "startup",
      kind: "mutual_match",
      fromId: talent.id,
      fromName: talent.name,
      fromType: "talent",
      message: `Mutual match with ${talent.name}. Time to talk.`,
      href: `/handshake?as=${startup.id}&with=${talent.id}`,
    });
  }
}
