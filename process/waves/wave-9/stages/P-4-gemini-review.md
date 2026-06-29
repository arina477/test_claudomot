CONCERN: The plan introduces a feature to revoke invites but scopes it only to temporary, ad-hoc invites, leaving the new default permanent server link irrevocable. This creates a significant administrative and security gap, as the primary, most-shared link cannot be reset or disabled if it is leaked or abused.

EVIDENCE: "Permanent servers.invite_code is NOT an ad-hoc invite — revoke applies to invites-table rows." This is coupled with the change to make this permanent code the default: "InviteShareModal reads the permanent invite_code from server detail → shows /invite/<permanent-code> as the default link."

SUGGESTION: Implement a mechanism for server owners to revoke or cycle the permanent `servers.invite_code` to provide full control over server access.
