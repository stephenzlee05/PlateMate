---
timestamp: 'Mon Nov 03 2025 21:29:28 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251103_212928.88f2a6b2.md]]'
content_id: a852322ee71456cf78f5cafc37e36369c29cdae006b11283fd65ef21e783f917
---

# response:

```typescript
// src/syncs/routines.sync.ts

// These two help you declare synchronizations
import { actions, Sync } from "@engine";
// Choose whatever concepts you have
// Remember to run `deno run build` if you get errors with @concepts
import { Requesting, Template, Volume } from "@concepts";

// =============================================================================
// Synchronizations for Template.createTemplate
// Assumed concept action: Template.createTemplate(name: string, content: string): (template: TemplateId) | (error: string)
// =============================================================================

/**
 * Handles incoming HTTP requests to create a new template.
 * When a request for "/templates/create" arrives, it triggers the Template.createTemplate action.
 */
export const CreateTemplateRequest: Sync = ({ request, name, content }) => ({
  when: actions([
    Requesting.request,
    { path: "/templates/create", name, content }, // Match on path and extract name/content
    { request }, // Bind the RequestId to the 'request' variable
  ]),
  then: actions([Template.createTemplate, { name, content }]), // Call concept action with extracted variables
});

/**
 * Responds to a successful template creation.
 * When a request for "/templates/create" has occurred, and Template.createTemplate
 * successfully returns a 'template' ID, respond to the original request with that ID.
 */
export const CreateTemplateResponseSuccess: Sync = ({ request, template }) => ({
  when: actions(
    [Requesting.request, { path: "/templates/create" }, { request }], // Match request to get the 'request' binding
    [Template.createTemplate, {}, { template }], // Match success output 'template' from the concept action
  ),
  then: actions([Requesting.respond, { request, template }]), // Respond to the request with the new template ID
});

/**
 * Responds to an error during template creation.
 * When a request for "/templates/create" has occurred, and Template.createTemplate
 * returns an 'error', respond to the original request with the error.
 */
export const CreateTemplateResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/templates/create" }, { request }], // Match request to get the 'request' binding
    [Template.createTemplate, {}, { error }], // Match error output 'error' from the concept action
  ),
  then: actions([Requesting.respond, { request, error }]), // Respond to the request with the error
});

// =============================================================================
// Synchronizations for Volume.updateVolume
// Assumed concept action: Volume.updateVolume(volumeId: VolumeId, newSize: number): (success: boolean) | (error: string)
// =============================================================================

/**
 * Handles incoming HTTP requests to update a volume's size.
 * When a request for "/volumes/update" arrives, it triggers the Volume.updateVolume action.
 */
export const UpdateVolumeRequest: Sync = ({ request, volumeId, newSize }) => ({
  when: actions([
    Requesting.request,
    { path: "/volumes/update", volumeId, newSize }, // Match on path and extract volumeId/newSize
    { request }, // Bind the RequestId
  ]),
  then: actions([Volume.updateVolume, { volumeId, newSize }]), // Call concept action
});

/**
 * Responds to a successful volume update.
 * When a request for "/volumes/update" has occurred, and Volume.updateVolume
 * successfully returns 'success: true', respond to the original request.
 */
export const UpdateVolumeResponseSuccess: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/volumes/update" }, { request }],
    [Volume.updateVolume, {}, { success }], // Match success output 'success' from the concept action
  ),
  then: actions([Requesting.respond, { request, success }]), // Respond with the success status
});

/**
 * Responds to an error during volume update.
 * When a request for "/volumes/update" has occurred, and Volume.updateVolume
 * returns an 'error', respond to the original request with the error.
 */
export const UpdateVolumeResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/volumes/update" }, { request }],
    [Volume.updateVolume, {}, { error }], // Match error output 'error' from the concept action
  ),
  then: actions([Requesting.respond, { request, error }]), // Respond with the error
});

// =============================================================================
// Synchronizations for Template.setDefaultTemplate
// Assumed concept action: Template.setDefaultTemplate(templateId: TemplateId): () | (error: string)
// (Returns nothing on successful completion, only an error on failure)
// =============================================================================

/**
 * Handles incoming HTTP requests to set a default template.
 * When a request for "/templates/setDefault" arrives, it triggers the Template.setDefaultTemplate action.
 */
export const SetDefaultTemplateRequest: Sync = ({ request, templateId }) => ({
  when: actions([
    Requesting.request,
    { path: "/templates/setDefault", templateId }, // Match on path and extract templateId
    { request }, // Bind the RequestId
  ]),
  then: actions([Template.setDefaultTemplate, { templateId }]), // Call concept action
});

/**
 * Responds to a successful default template setting.
 * When a request for "/templates/setDefault" has occurred, and Template.setDefaultTemplate
 * completes successfully (without an error output), respond to the original request with a success status.
 */
export const SetDefaultTemplateResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/templates/setDefault" }, { request }],
    [Template.setDefaultTemplate, {}, {}], // Match successful completion (no explicit output)
  ),
  then: actions([Requesting.respond, { request, status: "success" }]), // Respond with a generic success status
});

/**
 * Responds to an error during setting a default template.
 * When a request for "/templates/setDefault" has occurred, and Template.setDefaultTemplate
 * returns an 'error', respond to the original request with the error.
 */
export const SetDefaultTemplateResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/templates/setDefault" }, { request }],
    [Template.setDefaultTemplate, {}, { error }], // Match error output 'error' from the concept action
  ),
  then: actions([Requesting.respond, { request, error }]), // Respond with the error
});
```
