use std::{collections::HashMap, sync::Arc};

use ak_client::apis::outposts_api::outposts_proxy_list;
use ak_common::{Tasks, api::fetch_all};
use arc_swap::ArcSwap;
use argh::FromArgs;
use eyre::Result;
use tracing::{debug, error, info, instrument, warn};

use crate::outpost::proxy::application::Application;
use crate::outpost::{Outpost, OutpostController};

mod application;

#[derive(Debug, Default, FromArgs, PartialEq, Eq)]
/// Run the authentik proxy outpost.
#[argh(subcommand, name = "proxy")]
#[expect(
    clippy::empty_structs_with_brackets,
    reason = "argh doesn't support unit structs"
)]
pub(crate) struct Cli {}

pub(crate) struct ProxyOutpost {
    controller: Arc<OutpostController>,
    applications: ArcSwap<HashMap<String, Application>>,
}

impl Outpost for ProxyOutpost {
    type Cli = Cli;

    const OUTPOST_TYPE: &'static str = "proxy";

    #[instrument(skip_all)]
    async fn new(controller: Arc<OutpostController>) -> Result<Self> {
        Ok(Self {
            controller,
            applications: ArcSwap::from_pointee(HashMap::with_capacity(0)),
        })
    }

    fn start(&self, _tasks: &mut Tasks) -> Result<()> {
        Ok(())
    }

    #[instrument(skip_all)]
    async fn refresh(&self) -> Result<()> {
        debug!(
            outpost_pk = %self.controller.outpost.load().pk,
            "requesting providers for outpost"
        );

        let providers = fetch_all(
            |page| {
                outposts_proxy_list(
                    &self.controller.api_config,
                    None,
                    None,
                    Some(page),
                    Some(100_i32),
                    None,
                )
            },
            |r| &r.pagination,
            |r| r.results,
        )
        .await
        .inspect_err(|err| error!(?err, "failed to fetch providers"))?;
        debug!(count = providers.len(), "fetched providers");

        if providers.is_empty() && !self.controller.is_embedded() {
            warn!(
                "no providers assigned to this outpost, check outpost configuration in authentik"
            );
        }

        for (i, provider) in providers.iter().enumerate() {
            debug!(
                index = i,
                name = provider.name,
                external_host = provider.external_host,
                assigned_to_app = provider.assigned_application_name,
                "provider details"
            );
        }

        let mut apps = HashMap::with_capacity(providers.len());

        for provider in providers {
            let Ok(application) = Application::new(self, &provider)
                .inspect_err(|err| warn!(?err, "failed to setup application, skipping provider"))
            else {
                continue;
            };
            info!(
                name = provider.name,
                host = application.host,
                "loaded application"
            );

            apps.insert(application.host.clone(), application);
        }

        self.applications.swap(Arc::new(apps));

        Ok(())
    }

    async fn end_session(&self, _event: super::event::EventSessionEnd) -> Result<()> {
        // todo!()
        warn!(?_event, "removing session");
        Ok(())
    }
}
