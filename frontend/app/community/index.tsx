import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Card,
  FieldButton,
  Meta,
  SectionHead,
  Stamp,
} from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { Type } from '@/constants/Typography';

const posts = [
  {
    initial: 'M',
    name: 'Marisol',
    place: 'Batangas',
    time: '2d',
    tag: 'Field note',
    body: 'Forty percent shade through the dry weeks kept the outer leaves from scorching. The first cut graded better than last season — same soil, less sun.',
    replies: 12,
  },
  {
    initial: 'D',
    name: 'Dan',
    place: 'Nueva Ecija',
    time: '5d',
    tag: 'Diagnosis',
    body: 'Brown spots appeared three days after heavy rain, starting at the tips and moving inward. Removed the affected leaves, let the crown dry, and the new growth came back clean.',
    replies: 8,
  },
];

export default function CommunityIndexScreen() {
  const [composer, setComposer] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [draft, setDraft] = useState('');

  return (
    <ScreenShell
      eyebrow="06 / Community"
      title="Field notes, shared."
      description="What worked, what failed, what you would do differently. Notes are drafted offline and only leave the device when you choose to sync."
      index="community / optional"
      back
      actions={
        <FieldButton
          label={composer ? 'Close draft' : 'Write a field note'}
          onPress={() => setComposer((current) => !current)}
          variant={composer ? 'outline' : 'ink'}
        />
      }
    >
      {composer ? (
        <Card>
          <View style={styles.composerHead}>
            <View style={styles.composerHeadCopy}>
              <Meta tone="accent">New draft</Meta>
              <Text style={styles.composerTitle}>A note from the field</Text>
            </View>
            <Stamp label="Not published" />
          </View>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setComposerFocused(true)}
            onBlur={() => setComposerFocused(false)}
            multiline
            textAlignVertical="top"
            placeholder="What did you notice? What did you change? What would you tell the next grower?"
            placeholderTextColor={Palette.dim}
            style={[styles.composerInput, composerFocused && styles.composerInputFocused]}
            selectionColor={Palette.accent}
          />
          <View style={styles.composerFoot}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={styles.attach}
            >
              <View style={styles.attachDot} />
              <Text style={styles.attachText}>Attach a scan</Text>
            </Pressable>
            <FieldButton label="Publish when synced" variant="accent" compact disabled />
          </View>
          <Text style={styles.composerNote}>
            Drafts stay local. Publishing is enabled once the account and sync layers are
            connected.
          </Text>
        </Card>
      ) : null}

      <View style={styles.notice}>
        <View style={styles.noticeBar} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.noticeTitle}>Optional by design.</Text>
          <Text style={styles.noticeBody}>
            The core system works without an account. Community is the only module that
            needs a connection, and it can stay switched off.
          </Text>
        </View>
        <Stamp label="Optional" />
      </View>

      <View style={styles.section}>
        <SectionHead
          index="01 / Example feed"
          title="How a field note reads."
          aside="Preview only"
          note="These two notes are sample content, shown to demonstrate the reading layout. They are not live posts."
        />

        <View style={styles.feed}>
          {posts.map((post, index) => (
            <View key={post.name} style={[styles.post, index === 0 && styles.postFirst]}>
              <View style={styles.postHead}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{post.initial}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{post.name}</Text>
                    <Text style={styles.metaText}>
                      {post.place} · {post.time}
                    </Text>
                  </View>
                  <Text style={styles.tag}>{post.tag}</Text>
                </View>
                <Stamp label="Sample" />
              </View>
              <Text style={styles.postBody}>{post.body}</Text>
              <View style={styles.postFoot}>
                <Text style={styles.replies}>{post.replies} replies</Text>
                <Text style={styles.readNote}>Read note ↗</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHead index="02 / Ground rules" title="Useful before clever." aside="Three rules" />
        <View>
          {[
            ['01', 'Show the evidence', 'A photo and a scan result make a note worth reading twice.'],
            ['02', 'Name the conditions', 'Soil, weather and stage matter more than opinion.'],
            ['03', 'Leave a next step', 'Write what you would do differently, not just what happened.'],
          ].map(([id, title, note], index) => (
            <View key={id} style={[styles.ruleRow, index === 0 && styles.ruleRowFirst]}>
              <Text style={styles.ruleId}>{id}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.ruleTitle}>{title}</Text>
                <Text style={styles.ruleNote}>{note}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.syncCard}>
        <View style={{ flex: 1, gap: 6 }}>
          <Meta tone="accent">Sync, on your terms</Meta>
          <Text style={styles.syncTitle}>Nothing posts by accident.</Text>
          <Text style={styles.syncBody}>
            Community content waits in the queue with the rest of your records. If the
            signal never returns, the note stays yours.
          </Text>
        </View>
        <FieldButton label="Review identity" href="/modal" variant="outline" compact />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(46,70,51,0.24)',
    backgroundColor: Palette.mossSoft,
    borderRadius: 16,
  },
  noticeBar: {
    width: 2,
    alignSelf: 'stretch',
    backgroundColor: Palette.moss,
    borderRadius: 1,
  },
  noticeTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  noticeBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
    maxWidth: 520,
  },
  composerHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  composerHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  composerTitle: {
    ...Type.subtitle,
    fontSize: 22,
  },
  composerInput: {
    ...Type.body,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 110,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    color: Palette.text,
    backgroundColor: 'rgba(22,26,20,0.015)',
    outlineWidth: 0,
  },
  composerInputFocused: {
    borderColor: Palette.accent,
    backgroundColor: 'rgba(196,86,45,0.03)',
  },
  composerFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  attach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    opacity: 0.45,
  },
  attachDot: {
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.hairline,
  },
  attachText: {
    ...Type.labelSmall,
    color: Palette.muted,
  },
  composerNote: {
    ...Type.caption,
    fontSize: 9,
    lineHeight: 14,
    color: Palette.dim,
  },
  section: {
    gap: 22,
  },
  feed: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  post: {
    gap: 12,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  postFirst: {
    paddingTop: 16,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Palette.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 16,
    color: Palette.cream,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 13.5,
  },
  metaText: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.dim,
  },
  tag: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.accentDeep,
  },
  postBody: {
    ...Type.body,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 600,
  },
  postFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  replies: {
    ...Type.caption,
    color: Palette.muted,
  },
  readNote: {
    ...Type.labelSmall,
    fontSize: 11,
    color: Palette.accentDeep,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  ruleRowFirst: {
    borderTopColor: Palette.border,
  },
  ruleId: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
    paddingTop: 2,
  },
  ruleTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  ruleNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 20,
  },
  syncTitle: {
    ...Type.title,
    fontSize: 24,
  },
  syncBody: {
    ...Type.body,
    fontSize: 13,
    lineHeight: 20,
    color: Palette.muted,
    maxWidth: 480,
  },
});
