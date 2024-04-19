use std::{collections::HashMap, rc::Rc};

use near_sdk::{ env, log, near_bindgen, AccountId, NearToken };

struct Message {
    id: AccountId,
    premium_attached: Option<NearToken>,
    message: String,
}

impl Message {
    fn new(id: AccountId, premium: Option<NearToken>, message: &str) -> Self {
        log!("Creating new Message");
        Self {
            id,
            premium_attached: premium,
            message: message.to_string(),
        }
    }
}
#[near_bindgen]
#[derive(Default)]
pub struct MessageList {
    message_list_by_id: HashMap<AccountId, Vec<Rc<Message>>>,
    all_messages: Vec<Rc<Message>>,
    premium_messages: Vec<Rc<Message>>,
    highest_donation: Option<NearToken>,
}

#[near_bindgen]
impl MessageList {

    #[init]
    #[private]
    pub fn init() -> Self {
        Self {
            message_list_by_id: HashMap::new(),
            all_messages: vec![],
            premium_messages: vec![],
            highest_donation: None,
        }
    }

    #[payable]
    pub fn add_message(&mut self, message: &str) {
        let premium = if env::attached_deposit().is_zero() {
            None
        } else {
            Some(env::attached_deposit())
        };
        log!("Donation: {}", env::attached_deposit());
        let message = Rc::new(Message::new(env::signer_account_id(), premium, message));
        self.all_messages.push(Rc::clone(&message)); // Add owned copy of message to all messages
        log!("Added to all messages");
        // Update highest donation if such is the case
        self.highest_donation = match premium {
            None => self.highest_donation,
            Some(deposit) => {
                match self.highest_donation {
                    None => Some(deposit),
                    Some(previous_highest_donation) => {
                        if previous_highest_donation < deposit {
                            Some(deposit)
                        } else {
                            Some(previous_highest_donation)
                        }
                    }
                }
            }
        };
        // Add to premium messages if such is the case
        if !(env::attached_deposit().is_zero()) {
            self.premium_messages.push(Rc::clone(&message));
            log!("Added to premium messages");
        }

        // Update message_list_by_id
        self.message_list_by_id.entry(env::signer_account_id()).and_modify(|list| list.push(Rc::clone(&message))).or_insert(vec![Rc::clone(&message)]);
        log!("Updated hashmap entry");
    }
}



