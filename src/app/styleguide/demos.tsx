"use client";

// The components section of the styleguide: every component in rest, focus, loading, disabled,
// error and empty where they apply (CLAUDE.md, build rules). Client component because the
// segmented control, switch, tabs and banner hold state.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, NotAnsweredPill } from "@/components/ui/status-pill";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Banner, EmptyState, Toast } from "@/components/ui/banner";
import { FilePicker, FILE_PICKER_COPY } from "@/components/app/file-picker";

function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-5 md:grid-cols-[200px_1fr]">
      <div>
        <div className="font-medium">{title}</div>
        {note ? <div className="text-[13px] text-ink-muted">{note}</div> : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function Demos() {
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [proposed, setProposed] = useState(true);
  const [flag, setFlag] = useState(true);

  return (
    <div className="flex flex-col divide-y divide-hairline">
      <Row title="Buttons, app (40)" note="Primary, secondary, tertiary, destructive. Verbs as labels. One primary per screen.">
        <Button>Publish</Button>
        <Button variant="secondary">Reject all</Button>
        <Button variant="tertiary">Open the sample</Button>
        <Button variant="destructive">Delete sample</Button>
      </Row>
      <Row title="Button states" note="Loading keeps the label; disabled is the same control at 40 percent.">
        <Button loading>Publishing</Button>
        <Button disabled>Publish</Button>
        <Button variant="secondary" disabled>Reject all</Button>
      </Row>
      <Row title="Buttons, respondent (48)" note="Height 48 on the respondent side and marketing. On the respondent side the primary is ink, never the PM's accent (decision 0016); the violet gradient is the PM app's and marketing's.">
        <Button size="respondent" className="bg-none bg-ink text-ground shadow-none hover:shadow-none hover:brightness-110">Start section 1: Submitting</Button>
        <Button size="respondent" variant="secondary">Back</Button>
      </Row>
      <Row title="Inputs" note="40 high, hairline-strong, radius 12. Error: red border and a message that says what to do.">
        <div className="flex w-full max-w-[360px] flex-col gap-1.5">
          <Label htmlFor="sg-name">Project name</Label>
          <Input id="sg-name" placeholder="New expense tool" className="h-10 px-3 text-sm" />
        </div>
        <div className="flex w-full max-w-[360px] flex-col gap-1.5">
          <Label htmlFor="sg-email">Email</Label>
          <Input id="sg-email" defaultValue="not an address" aria-invalid className="h-10 px-3 text-sm" />
          <div className="text-[13px] text-danger">Enter the email address you signed up with.</div>
        </div>
        <div className="flex w-full max-w-[360px] flex-col gap-1.5">
          <Label htmlFor="sg-ctx">What is this about?</Label>
          <Textarea id="sg-ctx" rows={2} placeholder="Write a few words on what the list is for and who answers." />
        </div>
      </Row>
      <Row title="File picker" note="A label styled as the secondary button around the file input, the file's name beside it in muted text. The ring shows on the button while the input has the focus (design note 103).">
        <div className="flex w-full max-w-[360px] flex-col gap-1.5">
          <Label htmlFor="sg-file">Your file</Label>
          <FilePicker id="sg-file" name="file" accept=".xlsx,.csv" />
        </div>
        <div className="flex w-full max-w-[360px] flex-col gap-1.5">
          <Label htmlFor="sg-logo">Logo</Label>
          <FilePicker id="sg-logo" name="logo" accept="image/png,image/svg+xml" label={FILE_PICKER_COPY.chooseImage} disabled />
        </div>
      </Row>
      <Row title="Status pills" note="Tint fill, text from the table, 12 px weight 600. Always with the word.">
        <StatusPill status="agree" />
        <StatusPill status="pushedBack" />
        <StatusPill status="unclear" />
        <StatusPill status="missing" />
        <StatusPill status="disagree" />
        <NotAnsweredPill />
      </Row>
      <Row title="Toggle and segmented control" note="Toggle violet when on. Segmented control: tint track, surface active pill.">
        <div className="flex items-center gap-3">
          <Switch id="sg-proposed" checked={proposed} onCheckedChange={(v) => setProposed(!!v)} className="data-[size=default]:h-5 data-[size=default]:w-9" />
          <Label htmlFor="sg-proposed">Show the proposed value to respondents</Label>
        </div>
        <SegmentedControl
          label="Preview device"
          value={device}
          onChange={setDevice}
          options={[{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }]}
        />
      </Row>
      <Row title="Progress" note="4 px, violet fill, label and mono count above.">
        <div className="flex w-full max-w-[360px] flex-col gap-1.5">
          <div className="flex justify-between text-[13px]"><span>Answered</span><span className="font-mono text-xs text-ink-muted">4 of 6</span></div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={4} aria-label="Items answered" className="h-1 overflow-hidden rounded-full bg-tint">
            <div className="h-1 rounded-full bg-violet" style={{ width: "66.7%" }} />
          </div>
        </div>
      </Row>
      <Row title="Tabs" note="14 px, active ink with a 2 px violet underline.">
        <Tabs defaultValue="agreement" className="w-full">
          <TabsList variant="line">
            <TabsTrigger value="agreement">Agreement</TabsTrigger>
            <TabsTrigger value="pushed">Different priority 7 · Disagree 3</TabsTrigger>
            <TabsTrigger value="questions">Questions and gaps</TabsTrigger>
          </TabsList>
          <TabsContent value="agreement" className="pt-3 text-[13px] text-ink-muted">Agreement per item and area.</TabsContent>
          <TabsContent value="pushed" className="pt-3 text-[13px] text-ink-muted">Every different priority and every disagree with its reason.</TabsContent>
          <TabsContent value="questions" className="pt-3 text-[13px] text-ink-muted">Open questions and missing items.</TabsContent>
        </Tabs>
      </Row>
      <Row title="Banner" note="The ambiguity flag: a card on the soft violet gradient with a sun dot, a Dismiss pill.">
        {flag ? (
          <Banner onDismiss={() => setFlag(false)} className="w-full">
            <span className="font-medium">Ambiguity in CL-06.</span> The item does not say who repays a cash advance if the trip is cancelled.
          </Banner>
        ) : (
          <Button variant="secondary" size="small" onClick={() => setFlag(true)}>Show the banner again</Button>
        )}
      </Row>
      <Row title="Toast" note="Dark surface, light text, violet 300 action.">
        <Toast action="Undo">Reader version accepted for CL-01.</Toast>
      </Row>
      <Row title="Empty state" note="Dashed card, a title, one line that says what to do, the mascot in the pose that fits the screen where it is a first visit.">
        <EmptyState title="No answers yet" mascot="analysis" className="w-full max-w-[560px]">
          The link is not published. Share it, or open the sample project to see what results look like.
        </EmptyState>
      </Row>
      <Row title="Table" note="Header 36 at 12 px muted semibold; rows 40; hovered row tint.">
        <div className="w-full max-w-[720px] overflow-x-auto">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow className="h-8 bg-tint hover:bg-tint">
              <TableHead className="h-8 text-xs text-ink-muted">Respondent</TableHead>
              <TableHead className="h-8 text-xs text-ink-muted">Answer</TableHead>
              <TableHead className="h-8 text-xs text-ink-muted">Reason, question or comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="h-9 hover:bg-tint">
              <TableCell>Ioana Marin <span className="text-ink-muted">Sales</span></TableCell>
              <TableCell><StatusPill status="pushedBack" /></TableCell>
              <TableCell>Should be Must have. I find out I was over the limit three weeks later.</TableCell>
            </TableRow>
            <TableRow className="h-9 hover:bg-tint">
              <TableCell>Dana Okafor <span className="text-ink-muted">Finance</span></TableCell>
              <TableCell><StatusPill status="agree" /></TableCell>
              <TableCell className="text-ink-muted">Agrees with Should have.</TableCell>
            </TableRow>
            <TableRow className="h-9 hover:bg-tint">
              <TableCell>Sam Hill <span className="text-ink-muted">Office manager</span></TableCell>
              <TableCell><NotAnsweredPill /></TableCell>
              <TableCell className="text-ink-muted">In progress, 4 of 6.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </div>
      </Row>
      <Row title="Card" note="Radius 16, hairline, the card shadow, 16 padding, title 15 weight 700.">
        <Card className="card w-full max-w-[360px] p-4 ring-0">
          <CardHeader className="p-0">
            <CardTitle className="text-[15px] font-bold">Public link</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-3 text-[13px] text-ink-muted">Not published yet. Nobody can open the link.</CardContent>
        </Card>
      </Row>
    </div>
  );
}
