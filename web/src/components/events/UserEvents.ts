import { EventUser } from "@goauthentik/admin/events/utils";
import { DEFAULT_CONFIG } from "@goauthentik/common/api/config";
import { EventWithContext } from "@goauthentik/common/events";
import { actionToLabel } from "@goauthentik/common/labels";
import { formatElapsedTime } from "@goauthentik/common/temporal";
import "@goauthentik/components/ak-event-info";
import "@goauthentik/elements/Tabs";
import "@goauthentik/elements/buttons/Dropdown";
import "@goauthentik/elements/buttons/ModalButton";
import "@goauthentik/elements/buttons/SpinnerButton";
import { PaginatedResponse, Table, TableColumn } from "@goauthentik/elements/table/Table";
import { SlottedTemplateResult } from "@goauthentik/elements/types";

import { msg } from "@lit/localize";
import { TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { Event, EventsApi } from "@goauthentik/api";

@customElement("ak-events-user")
export class UserEvents extends Table<Event> {
    expandable = true;

    @property()
    order = "-created";

    @property()
    targetUser!: string;

    async apiEndpoint(): Promise<PaginatedResponse<Event>> {
        return new EventsApi(DEFAULT_CONFIG).eventsEventsList({
            ...(await this.defaultEndpointConfig()),
            username: this.targetUser,
        });
    }

    columns(): TableColumn[] {
        return [
            new TableColumn(msg("Action"), "action"),
            new TableColumn(msg("User"), "enabled"),
            new TableColumn(msg("Creation Date"), "created"),
            new TableColumn(msg("Client IP"), "client_ip"),
        ];
    }

    row(item: EventWithContext): SlottedTemplateResult[] {
        return [
            html`${actionToLabel(item.action)}`,
            EventUser(item),
            html`<div>${formatElapsedTime(item.created)}</div>
                <small>${item.created.toLocaleString()}</small>`,
            html`<span>${item.clientIp || msg("-")}</span>`,
        ];
    }

    renderExpanded(item: Event): TemplateResult {
        return html` <td role="cell" colspan="4">
                <div class="pf-c-table__expandable-row-content">
                    <ak-event-info .event=${item as EventWithContext}></ak-event-info>
                </div>
            </td>
            <td></td>
            <td></td>
            <td></td>`;
    }

    renderEmpty(): TemplateResult {
        return super.renderEmpty(
            html`<ak-empty-state
                ><span slot="header">${msg("No Events found.")}</span>
                <div slot="body">${msg("No matching events could be found.")}</div>
            </ak-empty-state>`,
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-events-user": UserEvents;
    }
}
